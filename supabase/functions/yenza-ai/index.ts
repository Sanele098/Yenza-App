import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DiagnosisRequest {
  imageData?: string;
  description: string;
  jobTitle?: string;
  jobCategory?: string;
  jobId?: string;
  mode: "learn" | "do";
  language: "en" | "zu";
}

interface Step {
  title: string;
  instruction: string;
  safetyNote?: string;
}

interface Tool {
  name: string;
  essential: boolean;
}

interface DiagnosisResponse {
  problemTitle: string;
  explanation: string;
  safetyWarning: string;
  needsProfessional: boolean;
  tools: Tool[];
  steps: Step[];
  estimatedTime: string;
  estimatedCost: string;
  confidence: "low" | "medium" | "high";
}

interface FollowUpRequest {
  diagnosisId: string;
  question: string;
  context: string;
  language: "en" | "zu";
}

const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. GEMINI_API_KEY is missing." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Follow-up Q&A route ----
    if (url.pathname.endsWith("/ask")) {
      const { diagnosisId, question, context, language } = (await req.json()) as FollowUpRequest;
      if (!question?.trim() || !diagnosisId) {
        return new Response(
          JSON.stringify({ error: "Question and diagnosisId are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save worker's question to conversation table
      await supabase.from("ai_conversations").insert({
        diagnosis_id: diagnosisId,
        worker_id: user.id,
        role: "worker",
        message: question.trim(),
      });

      const langInstruction = language === "zu"
        ? "Respond in isiZulu using simple everyday words."
        : "Respond in English using simple everyday words.";

      const prompt = `You are Yenza-AI, a digital supervisor helping a South African worker. ${langInstruction}
Context about the job: ${context}

The worker asks: "${question}"

Give a short, practical answer (2-4 sentences). Never encourage dangerous work. If the task involves gas, main electrical panels, or structural work, advise calling a qualified professional.`;

      const geminiRes = await fetch(
        `${GEMINI_URL}?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini follow-up error:", geminiRes.status, errText);
        return new Response(
          JSON.stringify({ error: `AI service error (Gemini ${geminiRes.status})` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const geminiData = await geminiRes.json();
      const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Save AI's answer to conversation table
      await supabase.from("ai_conversations").insert({
        diagnosis_id: diagnosisId,
        worker_id: user.id,
        role: "ai",
        message: answer,
      });

      return new Response(
        JSON.stringify({ answer }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Skill gap analysis route ----
    if (url.pathname.endsWith("/skill-gap")) {
      const body = await req.json() as {
        currentSkills: string[];
        experienceLevel: string;
        location: string;
        existingMilestones?: unknown[];
        targetSkill?: string;
        language?: "en" | "zu";
      };

      if (!body.currentSkills) {
        return new Response(
          JSON.stringify({ error: "currentSkills is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lang = body.language === "zu" ? "zu" : "en";
      const langInstruction = lang === "zu"
        ? "Write ALL text fields (summary, titles, descriptions, steps, resources, prerequisites) in isiZulu using simple, everyday words a South African worker would understand. Keep technical skill names recognizable."
        : "Write ALL text fields (summary, titles, descriptions, steps, resources, prerequisites) in English using simple, everyday words a South African worker would understand.";

      const isAddingMilestone = !!body.targetSkill;

      const prompt = isAddingMilestone
        ? `You are Yenza-AI, a career advisor for South African local-service workers.
A worker wants to add a new skill milestone: "${body.targetSkill}".

Their current skills: ${body.currentSkills.join(", ") || "none yet"}
Experience level: ${body.experienceLevel}
Location: ${body.location}

${langInstruction}

Create a single learning milestone for "${body.targetSkill}" — a practical, step-by-step path from where they are now to being able to offer this skill professionally.

Respond with ONLY a valid JSON object, no markdown fences:
{
  "id": "short-unique-id",
  "skill": "${body.targetSkill}",
  "title": "Short milestone title (5-10 words)",
  "description": "Why this skill matters and what it will unlock (2-3 sentences, simple language)",
  "steps": ["Step 1 description", "Step 2 description", "Step 3 description"],
  "estimatedTime": "e.g. 2-4 weeks",
  "resources": ["Resource 1", "Resource 2"],
  "prerequisites": "What they need before starting (or 'None — suitable for beginners')"
}`
        : `You are Yenza-AI, a career advisor for South African local-service workers (plumbers, electricians, cleaners, gardeners, painters, etc.).

A worker wants a skill gap analysis — where they are now and a path to where they should go.

Current skills: ${body.currentSkills.join(", ") || "none yet"}
Experience level: ${body.experienceLevel}
Location: ${body.location}

${langInstruction}

Analyze their current position and create a personalized learning path with 2-4 milestones. Each milestone should be a skill they don't yet have that would increase their earning potential, ordered by priority (most impactful first).

Consider the South African context — practical trades, local demand, and accessible training.

Respond with ONLY a valid JSON object, no markdown fences:
{
  "summary": "A 2-3 sentence plain-language assessment of where the worker stands and the overall direction they should take",
  "milestones": [
    {
      "id": "short-unique-id",
      "skill": "Skill name",
      "title": "Milestone title (5-10 words)",
      "description": "Why this skill and what it unlocks (2-3 sentences)",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "estimatedTime": "e.g. 2-4 weeks",
      "resources": ["Training resource 1", "Resource 2"],
      "prerequisites": "What they need first (or 'None — suitable for beginners')"
    }
  ]
}`;

      const geminiRes = await fetch(
        `${GEMINI_URL}?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 2000 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini skill-gap error:", geminiRes.status, errText);
        return new Response(
          JSON.stringify({ error: `AI service error (Gemini ${geminiRes.status})` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      let jsonText = rawText.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }

      let aiResult: { summary?: string; milestones?: unknown[] };
      try {
        aiResult = JSON.parse(jsonText);
      } catch {
        console.error("Gemini returned non-JSON for skill-gap:", jsonText.slice(0, 300));
        return new Response(
          JSON.stringify({ error: "AI returned an unexpected response. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (isAddingMilestone) {
        const milestone = aiResult.milestones?.[0] ?? aiResult;
        return new Response(
          JSON.stringify({ milestone }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!aiResult.milestones || !Array.isArray(aiResult.milestones)) {
        return new Response(
          JSON.stringify({ error: "AI could not generate a skill path. Please try again." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Compute snapshot hash for change detection
      const skillsStr = [...body.currentSkills].sort().join(",") + "|" + body.experienceLevel;
      let hash = 0;
      for (let i = 0; i < skillsStr.length; i++) {
        hash = ((hash << 5) - hash + skillsStr.charCodeAt(i)) | 0;
      }
      const snapshotHash = String(hash);

      // Upsert the analysis (service role client bypasses RLS)
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error: upsertErr } = await adminClient
        .from("skill_gap_analyses")
        .upsert({
          worker_id: user.id,
          current_skills: body.currentSkills,
          experience_level: body.experienceLevel,
          location: body.location,
          summary: aiResult.summary ?? "",
          milestones: aiResult.milestones,
          skill_snapshot_hash: snapshotHash,
        }, { onConflict: "worker_id" });

      if (upsertErr) {
        console.error("Skill gap upsert error:", upsertErr.message);
      }

      return new Response(
        JSON.stringify({
          summary: aiResult.summary ?? "",
          milestones: aiResult.milestones,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Main diagnosis route ----
    const body = (await req.json()) as DiagnosisRequest;

    if (!body.description?.trim()) {
      return new Response(
        JSON.stringify({ error: "A description of the problem is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langInstruction = body.language === "zu"
      ? "Write all text fields in isiZulu using simple everyday words a worker would understand."
      : "Write all text fields in English using simple everyday words a worker would understand.";

    const modeInstruction = body.mode === "learn"
      ? "This is LEARN mode: the worker wants to understand the skill and technique. Explain the approach thoroughly, include why each step matters."
      : "This is DO mode: the worker has an active job. Give practical, action-focused steps they can follow right now.";

    const systemPrompt = `You are Yenza-AI, a digital supervisor for South African local-service workers (plumbers, electricians, cleaners, gardeners, painters, etc.).
Your job is to explain problems in simple language and guide workers step by step, like a patient mentor.

${langInstruction}
${modeInstruction}

The worker says: "${body.description}"
${body.jobTitle ? `Job title: ${body.jobTitle}` : ""}
${body.jobCategory ? `Job category: ${body.jobCategory}` : ""}

${body.imageData ? "A photo of the problem has been provided. Use it to inform your diagnosis." : "No photo was provided. Base your guidance on the description."}

Respond with ONLY a valid JSON object, no markdown fences, no extra text, with this exact structure:
{
  "problemTitle": "Short name for the problem (5-8 words)",
  "explanation": "Simple explanation of what is likely wrong and why (2-3 sentences)",
  "safetyWarning": "A specific safety instruction the worker must follow before starting",
  "needsProfessional": true if this requires a qualified/certified professional, false otherwise,
  "tools": [{ "name": "tool name", "essential": true/false }],
  "steps": [{ "title": "short step title", "instruction": "what to do in simple words", "safetyNote": "optional safety reminder for this step" }],
  "estimatedTime": "e.g. 30-45 minutes",
  "estimatedCost": "e.g. R50-R150 for parts",
  "confidence": "low/medium/high based on how certain you are"
}

Rules:
- 3 to 6 steps maximum
- Keep each step instruction under 40 words
- Never encourage a worker to do gas work, main electrical panel work, or structural changes
- If needsProfessional is true, the safetyWarning must say so clearly
- Use South African Rand (R) for costs
- Do not include any text outside the JSON object`;

    // Build parts array — Gemini REST API uses camelCase field names
    const parts: Array<Record<string, unknown>> = [];

    if (body.imageData) {
      const base64Data = body.imageData.includes(",")
        ? body.imageData.split(",")[1]
        : body.imageData;
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64Data },
      });
    }
    parts.push({ text: systemPrompt });

    const geminiRes = await fetch(
      `${GEMINI_URL}?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini diagnosis error:", geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `AI service error (Gemini ${geminiRes.status}). ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if present
    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let diagnosis: DiagnosisResponse;
    try {
      diagnosis = JSON.parse(jsonText) as DiagnosisResponse;
    } catch {
      console.error("Gemini returned non-JSON:", jsonText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "AI returned an unexpected response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!diagnosis.steps || !Array.isArray(diagnosis.steps) || diagnosis.steps.length === 0) {
      return new Response(
        JSON.stringify({ error: "AI could not generate guidance for this problem. Try describing it differently." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save diagnosis to database
    const { data: savedRow, error: saveError } = await supabase
      .from("ai_diagnoses")
      .insert({
        worker_id: user.id,
        job_id: body.jobId ?? null,
        mode: body.mode,
        language: body.language,
        description: body.description.trim(),
        problem_title: diagnosis.problemTitle,
        explanation: diagnosis.explanation,
        safety_warning: diagnosis.safetyWarning,
        needs_professional: diagnosis.needsProfessional,
        tools: diagnosis.tools ?? [],
        steps: diagnosis.steps ?? [],
        estimated_time: diagnosis.estimatedTime ?? "",
        estimated_cost: diagnosis.estimatedCost ?? "",
        confidence: diagnosis.confidence ?? "medium",
      })
      .select("id")
      .single();

    const diagnosisId = savedRow?.id ?? "";

    return new Response(
      JSON.stringify({ ...diagnosis, id: diagnosisId, saveError: saveError?.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
