import { createClient } from "@supabase/supabase-js";

const TOSS_API_SECRET_KEY = Deno.env.get("TOSS_API_SECRET_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    // CORS Preflight Request 처리
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. 요청 검증
        if (req.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("EXPO_PUBLIC_SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseKey || !TOSS_API_SECRET_KEY) {
            console.error("Missing essential environment variables:", { 
                hasUrl: !!supabaseUrl, 
                hasKey: !!supabaseKey, 
                hasSecret: !!TOSS_API_SECRET_KEY 
            });
            throw new Error("서버 환경 설정이 올바르지 않습니다.");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        
        // 인증 토큰 체크 (프런트에서 넘어온 Bearer token)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("인증 토큰이 없습니다.");

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        
        if (authError || !user) {
            console.error("Auth Error:", authError);
            throw new Error("인증되지 않은 요청입니다.");
        }

        // 2. 바디 파싱 { authKey, customerKey, plan, price }
        const { authKey, customerKey, plan, price } = await req.json();

        if (!authKey || !customerKey) {
            throw new Error("토스 인증 정보(authKey/customerKey)가 부족합니다.");
        }

        console.log(`[Billing Auth] Start for user ${user.id} (${customerKey})`);

        // 3. 토스페이먼츠 빌링키 발급 API 호출
        // Authorization: Basic 인코딩 (시크릿키: 를 base64로 인코딩)
        const encodedAuth = btoa(`${TOSS_API_SECRET_KEY}:`);
        
        const tossIssueResponse = await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                authKey,
                customerKey,
            }),
        });

        const tossIssueData = await tossIssueResponse.json();

        if (!tossIssueResponse.ok) {
            console.error("Toss Billing Issue Error:", tossIssueData);
            throw new Error(`빌링키 발급 실패: ${tossIssueData.message || "알 수 없는 오류"}`);
        }

        const billingKey = tossIssueData.billingKey;
        console.log("[Billing Auth] Successfully issued billingKey");

        // 4. 즉시 첫 달 요금 승인 요청 (구독 시작)
        const amount = parseInt(String(price), 10) || 0;
        if (amount <= 0) {
            console.warn("[Billing] Amount is 0 or invalid, skipping initial payment request.");
        } else {
            console.log(`[Billing] Processing initial payment of ${amount} won...`);
            const orderId = `order_${Date.now()}_${user.id.substring(0, 6)}`;
            
            const paymentResponse = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${encodedAuth}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerKey,
                    amount: amount,
                    orderId: orderId,
                    orderName: `Publica ${plan.toUpperCase()} 구독`,
                    customerEmail: user.email,
                    taxFreeAmount: 0
                }),
            });
            
            const paymentData = await paymentResponse.json();
            
            if (!paymentResponse.ok) {
                console.error("Toss Initial Payment Error:", paymentData);
                // 빌링키는 발급되었으나 첫 결제에서 실패한 경우에 대한 처리가 필요할 수 있음
                throw new Error(`결제 승인 실패: ${paymentData.message || "알 수 없는 오류"}`);
            }
            console.log("[Billing] Initial payment successful:", paymentData.paymentKey);
        }

        // 5. DB에 구독 정보(빌링키 포함) 저장
        const { error: dbError } = await supabaseAdmin
            .from("subscriptions")
            .upsert({
                user_id: user.id,
                plan: plan.toLowerCase(),
                status: "active",
                billing_cycle: "monthly",
                toss_billing_key: billingKey,
                toss_customer_key: customerKey,
                amount: amount,
                current_period_start: new Date().toISOString(),
                // 한달 후 만료일 설정 (30일 단위)
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            });

        if (dbError) {
            console.error("DB Upsert Error:", dbError);
            throw new Error("구독 정보 DB 저장 중 에러가 발생했습니다.");
        }

        console.log("[Billing] All processes completed successfully.");
        return new Response(JSON.stringify({ success: true, billingKey }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Handler Exception:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
