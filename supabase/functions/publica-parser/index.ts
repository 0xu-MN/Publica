import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { action, fileBase64, fileName, jobId } = await req.json();
        const apiKey = Deno.env.get('LLAMA_CLOUD_API_KEY');

        if (!apiKey) throw new Error("Missing LLAMA_CLOUD_API_KEY");

        // --- MODE 1: UPLOAD (작업 시작) ---
        if (action === 'upload') {
            console.log(`🚀 [Parser] Starting Upload: ${fileName}`);

            const binaryStr = atob(fileBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/pdf' });

            const formData = new FormData();
            formData.append("file", blob, fileName);
            formData.append("gpt4o_mode", "true");

            const uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}` },
                body: formData,
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error(`LlamaCloud Upload Failed: ${errText}`);
            }

            const { id } = await uploadRes.json();
            console.log(`✅ [Parser] Job Created: ${id}`);

            // 바로 Job ID만 반환 (타임아웃 방지)
            return new Response(
                JSON.stringify({ success: true, jobId: id }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // --- MODE 2: CHECK (상태 확인) ---
        if (action === 'check') {
            if (!jobId) throw new Error("Missing jobId");

            // 1. 상태 먼저 확인
            const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
                headers: { "Authorization": `Bearer ${apiKey}` },
            });
            const statusData = await statusRes.json();
            console.log(`🔍 [Parser] Job Status (${jobId}): ${statusData.status}`);
            console.log("🔍 [Debug] Raw LlamaCloud Status Response:", JSON.stringify(statusData).substring(0, 500));

            // 2. 만약 성공했다면 결과 엔드포인트에서 마크다운 가져오기
            if (statusData.status === 'SUCCESS' || statusData.status === 'COMPLETED') {
                console.log(`🎯 [Parser] Job Success! Fetching markdown result...`);
                const resultRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
                    headers: { "Authorization": `Bearer ${apiKey}` },
                });

                if (!resultRes.ok) {
                    const errText = await resultRes.text();
                    console.error("❌ [Parser] Result Fetch Failed:", errText);
                    return new Response(
                        JSON.stringify({ success: true, status: "SUCCESS", markdown: "Error fetching result: " + errText }),
                        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                const resultText = await resultRes.text();
                // console.log("📦 [Debug] Raw Result Data:", resultText.substring(0, 1000));

                let markdownContent = "";
                try {
                    const resultData = JSON.parse(resultText);
                    console.log("📦 [Parser] Raw Result Keys:", Object.keys(resultData));

                    // Robust Extraction Strategy
                    if (resultData.markdown) {
                        markdownContent = resultData.markdown;
                    } else if (resultData.job && resultData.job.markdown) {
                        markdownContent = resultData.job.markdown;
                    } else if (resultData.result && resultData.result.markdown) {
                        markdownContent = resultData.result.markdown;
                    } else {
                        // 만약 JSON인데 markdown 키가 없으면 전체를 문자열로 보냄
                        markdownContent = resultText;
                    }
                } catch (e) {
                    // JSON이 아니면 텍스트 자체를 마크다운으로 간주
                    markdownContent = resultText;
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        status: "SUCCESS",
                        markdown: markdownContent || "Parsing completed but no content found."
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // 3. 아직 진행 중이거나 실패한 경우
            return new Response(
                JSON.stringify({
                    success: true,
                    status: statusData.status || "PROCESSING",
                    markdown: null
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        throw new Error(`Invalid action: ${action}`);

    } catch (error: any) {
        console.error(`🚨 Error: ${error.message}`);
        // 에러 내용을 JSON으로 보내주기 위해 200 OK로 위장
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
