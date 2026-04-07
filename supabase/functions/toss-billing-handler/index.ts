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
            throw new Error("Missing essential environment variables");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        
        // 인증 토큰 체크 (프론트에서 넘어온 Bearer token)
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        
        if (authError || !user) {
            throw new Error("Unauthorized user request");
        }

        // 2. 바디 파싱 { authKey, customerKey, plan, price }
        const { authKey, customerKey, plan, price } = await req.json();

        if (!authKey || !customerKey) {
            throw new Error("Missing authKey or customerKey from Toss");
        }

        console.log(`Requesting billing key for user ${user.id} (${customerKey})`);

        // 3. 토스페이먼츠 빌링키 발급 API 호출
        // 개발자 가이드에 따라 Authorization: Basic 인코딩 (시크릿키: 를 base64로 인코딩)
        const encodedAuth = btoa(`${TOSS_API_SECRET_KEY}:`);
        
        const tossResponse = await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue", {
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

        const tossData = await tossResponse.json();

        if (!tossResponse.ok) {
            console.error("Toss Billing Issue Error:", tossData);
            throw new Error(tossData.message || "빌링키 발급에 실패했습니다.");
        }

        const billingKey = tossData.billingKey;
        console.log("Successfully issued billingKey");

        // 4. 즉시 첫 달 요금 승인 요청 (옵션 - 현재는 곧바로 결제로 이어집니다)
        console.log(`Processing initial payment of ${price} won...`);
        const orderId = `order_${Date.now()}_${user.id.substring(0,6)}`;
        
        const paymentResponse = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                customerKey,
                amount: price,
                orderId: orderId,
                orderName: `Publica ${plan} (정기구독)`,
                customerEmail: user.email,
                taxFreeAmount: 0
            }),
        });
        
        const paymentData = await paymentResponse.json();
        
        if (!paymentResponse.ok) {
            console.error("Toss Initial Payment Error:", paymentData);
            throw new Error(paymentData.message || "첫 결제 승인에 실패했습니다.");
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
                toss_order_id: orderId,
                amount: price,
                current_period_start: new Date().toISOString(),
                // 한달 후 만료일 설정 (30일)
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            });

        if (dbError) {
            console.error("DB Upsert Error:", dbError);
            throw new Error("구독 정보 저장 중 에러가 발생했습니다.");
        }

        return new Response(JSON.stringify({ success: true, payment: paymentData }), {
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
