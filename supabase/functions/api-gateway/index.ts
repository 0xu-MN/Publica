import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Initialize Environment Variables
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// CORS Headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Main Request Handler
 */
serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { action_type, ...params } = await req.json();
        console.log(`[API Gateway] Processing action: ${action_type}`);

        let result;

        switch (action_type) {
            case "dashboard_refresh":
                result = await handleDashboardRefresh(params);
                break;
            case "agent_context":
                result = await handleAgentContext(params);
                break;
            case "file_process":
                result = await handleFileProcess(params);
                break;
            case "career_match":
                result = await handleCareerMatch(params);
                break;
            default:
                throw new Error(`Unknown action_type: ${action_type}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error(`[API Gateway] Error:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

/**
 * 1. Dashboard Refresh Logic
 * - Fetches mock Grants API
 * - Uses Gemini to filter top 3 matches based on user profile
 */
async function handleDashboardRefresh({ user_id }: any) {
    // 1. Fetch Mock Data (Simulating Government API)
    const mockGrants = [
        { id: 1, title: "AI Startup Voucher 2026", focus: "AI, SaaS", amount: "100M KRW" },
        { id: 2, title: "Eco-Friendly Tech Support", focus: "Environment", amount: "50M KRW" },
        { id: 3, title: "Global Market Entry Package", focus: "Export, SaaS", amount: "30M KRW" },
        { id: 4, title: "Youth Founder Loan", focus: "General", amount: "100M KRW" },
        { id: 5, title: "Data Dam Project", focus: "Data Labeling", amount: "200M KRW" }
    ];

    // 2. Fetch User Profile (Mock for now, would be DB call)
    const userProfile = { focus: "SaaS", stage: "Pre-Seed", tech: ["AI", "React Native"] };

    // 3. Use Gemini to Filter
    const prompt = `
        User Profile: ${JSON.stringify(userProfile)}
        Available Grants: ${JSON.stringify(mockGrants)}
        
        Task: Select the top 3 grants that best match the user's profile.
        Return ONLY a JSON array of the selected grant objects. No markdown.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean and parse JSON
    const validJson = responseText.replace(/```json|```/g, "").trim();
    const recommendedGrants = JSON.parse(validJson);

    return {
        success: true,
        data: {
            user_profile: userProfile,
            recommendations: recommendedGrants
        }
    };
}

/**
 * 2. Agent Context Logic
 * - Fetches recent work logs
 * - Summarizes context and suggests next steps
 */
async function handleAgentContext({ project_id }: any) {
    // 1. Fetch Work Logs (Simulated DB Call)
    // const { data: workLogs } = await supabase.from('work_logs').select('*').eq('project_id', project_id).limit(5);
    const workLogs = [
        "Implemented Sidebar UI component",
        "Refactored Agent layout for split view",
        "Researched TailwindCSS grid layouts"
    ];

    // 2. Gemini Summary
    const prompt = `
        Recent Logs: ${JSON.stringify(workLogs)}
        
        Task: precise summary of recent progress and suggest 3 logical Next Steps.
        Return JSON: { "summary": "...", "next_steps": ["...", "...", "..."] }
    `;

    const result = await model.generateContent(prompt);
    const validJson = result.response.text().replace(/```json|```/g, "").trim();

    return {
        success: true,
        data: JSON.parse(validJson)
    };
}

/**
 * 3. File Processing Logic
 * - Simulates reading file text
 * - Extracts metadata using Gemini
 * - Updates 'files' table
 */
async function handleFileProcess({ file_url, user_id }: any) {
    // 1. Simulate Reading File (In real app, fetch(file_url).text())
    const simulatedFileContent = "This document outlines the 2026 Marketing Strategy for Project Phoenix. Key focus: Gen Z targeting via TikTok.";

    // 2. Gemini Extraction
    const prompt = `
        Content: "${simulatedFileContent}"
        
        Task: Extract 5 keywords and a 1-sentence summary.
        Return JSON: { "keywords": ["...", ...], "summary": "..." }
    `;

    const result = await model.generateContent(prompt);
    const metadata = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

    // 3. Update Database (Actual Logic)
    /* 
    const { error } = await supabase
        .from('files')
        .update({ metadata: metadata, status: 'processed' })
        .eq('url', file_url);
    if (error) throw error; 
    */

    return {
        success: true,
        data: metadata
    };
}

/**
 * 4. Career Matching Logic
 * - Generates career advice based on expertise
 */
async function handleCareerMatch({ user_id }: any) {
    // 1. Fetch Expertise (Mock)
    const expertiseScore = { coding: 90, design: 40, marketing: 60 };

    // 2. Gemini Advice
    const prompt = `
        Expertise Score: ${JSON.stringify(expertiseScore)}
        
        Task: Provide a short, encouraging career advice message (max 2 sentences) and 1 recommended role title.
        Return JSON: { "message": "...", "recommended_role": "..." }
    `;

    const result = await model.generateContent(prompt);
    const advice = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

    return {
        success: true,
        data: advice
    };
}
