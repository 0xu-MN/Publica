// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

/**
 * parse-grant-template: Extract section structure from grant application forms
 * 
 * Flow:
 *   1. Receive grant_id + PDF/HWP URL (or base64)
 *   2. If URL: fetch & convert to base64
 *   3. Send to LlamaCloud via publica-parser for markdown extraction
 *   4. Send markdown to Gemini to extract section structure
 *   5. Save to grant_templates table
 * 
 * Input modes:
 *   - { grant_id, file_url } — fetch from URL
 *   - { grant_id, file_base64, file_name } — direct base64
 *   - { grant_id, grant_description } — extract from text description (no file)
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECTION_EXTRACTION_PROMPT = `
You are an expert at analyzing Korean government grant (정부지원사업) application forms.
Given the following document content, extract the **application form sections** (지원 양식 섹션) that applicants need to fill out.

## 🚨 RULES
1. Output ONLY valid JSON array. No conversational text.
2. Each section object must have: title, description, required, max_length (nullable), order, hints (nullable)
3. Focus on the SUBMISSION FORM sections — what the applicant actually writes.
4. Common sections include: 사업 개요, 문제인식(Problem), 해결방안(Solution), 성장전략(Scale-up), 팀 구성, 자금 소요, 사업 모델, 기술 설명 등
5. If the document doesn't have a clear form structure, infer a standard PSST-like structure based on the grant type.
6. Order sections logically (1-based).
7. ALL text must be in Korean.

## OUTPUT FORMAT (JSON Array)
[
  {
    "title": "사업 개요",
    "description": "사업의 전반적인 개요와 목표를 기술하세요",
    "required": true,
    "max_length": 2000,
    "order": 1,
    "hints": "지원 사업의 목적에 부합하는 내용을 중심으로 작성"
  }
]
`;

Deno.serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { grant_id, file_url, file_base64, file_name, grant_description } = body;

        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const llamaKey = Deno.env.get('LLAMA_CLOUD_API_KEY');

        if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");
        if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase credentials");

        let sourceMarkdown = '';

        // ═══════════════════════════════════════════
        // Mode 1: Parse from file (PDF/HWP)
        // ═══════════════════════════════════════════
        if (file_base64 || file_url) {
            let base64Data = file_base64;
            let fileName = file_name || 'grant_template.pdf';

            // If URL provided, fetch the file first
            if (!base64Data && file_url) {
                console.log(`📥 Fetching file from URL: ${file_url}`);
                try {
                    const fileRes = await fetch(file_url);
                    if (!fileRes.ok) throw new Error(`Failed to fetch file: ${fileRes.status}`);
                    const arrayBuffer = await fileRes.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    // Convert to base64
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    base64Data = btoa(binary);
                    // Extract filename from URL
                    const urlParts = file_url.split('/');
                    fileName = urlParts[urlParts.length - 1] || fileName;
                } catch (fetchErr: any) {
                    console.warn(`⚠️ File fetch failed: ${fetchErr.message}, falling back to description mode`);
                }
            }

            // If we have base64 data, parse with LlamaCloud
            if (base64Data && llamaKey) {
                console.log(`🚀 Sending to LlamaCloud for parsing: ${fileName}`);

                // Step 1: Upload to LlamaCloud
                const binaryStr = atob(base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
                const blob = new Blob([bytes], { type: 'application/pdf' });

                const formData = new FormData();
                formData.append("file", blob, fileName);
                formData.append("gpt4o_mode", "true");

                const uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${llamaKey}` },
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    console.error(`❌ LlamaCloud upload failed: ${errText}`);
                } else {
                    const { id: jobId } = await uploadRes.json();
                    console.log(`📋 LlamaCloud Job: ${jobId}`);

                    // Poll for result (max 60 seconds)
                    let attempts = 0;
                    while (attempts < 12) {
                        await new Promise(r => setTimeout(r, 5000)); // 5s interval
                        attempts++;

                        const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
                            headers: { "Authorization": `Bearer ${llamaKey}` },
                        });
                        const statusData = await statusRes.json();
                        console.log(`🔍 Job status (attempt ${attempts}): ${statusData.status}`);

                        if (statusData.status === 'SUCCESS' || statusData.status === 'COMPLETED') {
                            const resultRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
                                headers: { "Authorization": `Bearer ${llamaKey}` },
                            });
                            const resultText = await resultRes.text();
                            try {
                                const resultData = JSON.parse(resultText);
                                sourceMarkdown = resultData.markdown || resultData.job?.markdown || resultData.result?.markdown || resultText;
                            } catch {
                                sourceMarkdown = resultText;
                            }
                            break;
                        }

                        if (statusData.status === 'ERROR' || statusData.status === 'FAILED') {
                            console.error(`❌ LlamaCloud job failed`);
                            break;
                        }
                    }
                }
            }
        }

        // ═══════════════════════════════════════════
        // Mode 2: Extract from grant description text
        // ═══════════════════════════════════════════
        if (!sourceMarkdown && grant_description) {
            sourceMarkdown = grant_description;
        }

        // ═══════════════════════════════════════════
        // Mode 3: Fetch description from grants table
        // ═══════════════════════════════════════════
        if (!sourceMarkdown && grant_id) {
            const grantRes = await fetch(`${supabaseUrl}/rest/v1/grants?id=eq.${grant_id}&select=title,description,summary,eligibility,support_details,application_method`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
            });
            const grants = await grantRes.json();
            if (grants.length > 0) {
                const g = grants[0];
                sourceMarkdown = `
공고명: ${g.title}
공고 요약: ${g.summary || ''}
공고 상세: ${g.description || ''}
지원 대상: ${g.eligibility || ''}
지원 내용: ${g.support_details || ''}
신청 방법: ${g.application_method || ''}
                `.trim();
            }
        }

        if (!sourceMarkdown) {
            throw new Error("No content available for template extraction. Provide file_url, file_base64, or grant_description.");
        }

        // ═══════════════════════════════════════════
        // Extract sections with Gemini
        // ═══════════════════════════════════════════
        console.log(`🤖 Sending ${sourceMarkdown.length} chars to Gemini for section extraction...`);

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: SECTION_EXTRACTION_PROMPT + "\n\n---\n\n## 공고문/양식 내용:\n\n" + sourceMarkdown.substring(0, 8000) }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini API Error: ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        let sections: any[] = [];
        try {
            sections = JSON.parse(rawText);
            if (!Array.isArray(sections)) sections = [sections];
        } catch (e) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                sections = JSON.parse(jsonMatch[1]);
            } else {
                console.error('Failed to parse Gemini response as JSON:', rawText.substring(0, 500));
                throw new Error('Failed to parse section structure from AI response');
            }
        }

        console.log(`✅ Extracted ${sections.length} sections`);

        // ═══════════════════════════════════════════
        // Save to grant_templates table
        // ═══════════════════════════════════════════
        if (grant_id) {
            // Upsert: delete existing template for this grant, insert new one
            await fetch(`${supabaseUrl}/rest/v1/grant_templates?grant_id=eq.${grant_id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
            });

            const insertRes = await fetch(`${supabaseUrl}/rest/v1/grant_templates`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
                    grant_id,
                    sections,
                    source_markdown: sourceMarkdown.substring(0, 50000),
                    raw_form_url: file_url || null,
                }),
            });

            if (!insertRes.ok) {
                const errText = await insertRes.text();
                console.error(`❌ Failed to save template: ${errText}`);
            } else {
                console.log(`💾 Template saved for grant ${grant_id}`);
            }
        }

        return new Response(
            JSON.stringify({ success: true, sections, source_length: sourceMarkdown.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error(`🚨 Error: ${error.message}`);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
