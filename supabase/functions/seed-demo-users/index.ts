import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface DemoUser {
  email: string;
  password: string;
  displayName: string;
  firstName: string;
  surname: string;
  phone: string;
  role: "worker" | "employer";
  accountType?: string;
  location: string;
  bio?: string;
  experienceLevel?: string;
  experienceDetail?: string;
  serviceAreas?: string[];
  availabilityDays?: string[];
  qualificationsSummary?: unknown[];
}

const demoUsers: DemoUser[] = [
  {
    email: "sanele.b@example.co.za",
    password: "YenzaWorker2026!",
    displayName: "Sanele Buthelezi",
    firstName: "Sanele",
    surname: "Buthelezi",
    phone: "082 555 0147",
    role: "worker",
    location: "Newcastle, KwaZulu-Natal",
    bio: "I provide plumbing and general maintenance services around Newcastle. I focus on household repairs, installations and maintenance work.",
    experienceLevel: "3–5 years",
    experienceDetail:
      "Started as a plumber apprentice in 2020. Worked on residential installations and repairs, water systems and geysers. Also take on general maintenance and painting jobs around the Newcastle area.",
    serviceAreas: ["Newcastle CBD", "Arbor Park", "Hutten Heights"],
    availabilityDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    qualificationsSummary: [
      { label: "Identity verification", status: "not_verified", description: "Confirm your identity so customers know who they are hiring." },
      { label: "Qualification", status: "not_provided", description: "Add certificates or proof of training for skilled services." },
      { label: "Professional registration", status: "not_provided", description: "Add registration numbers for regulated trades (e.g. plumbing, electrical)." },
    ],
  },
  {
    email: "thandi.m@example.co.za",
    password: "YenzaWorker2026!",
    displayName: "Thandi Mthembu",
    firstName: "Thandi",
    surname: "Mthembu",
    phone: "083 222 1045",
    role: "employer",
    accountType: "Household",
    location: "Newcastle CBD",
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const results: { email: string; status: string; userId?: string; error?: string }[] = [];

    for (const demo of demoUsers) {
      // Check if user already exists
      const { data: existing } = await adminClient.auth.admin.listUsers();
      const found = existing?.users?.find((u) => u.email === demo.email);

      let userId: string;

      if (found) {
        userId = found.id;
        results.push({ email: demo.email, status: "already_exists", userId });
      } else {
        const { data, error } = await adminClient.auth.admin.createUser({
          email: demo.email,
          password: demo.password,
          email_confirm: true,
          user_metadata: {
            display_name: demo.displayName,
            first_name: demo.firstName,
            surname: demo.surname,
            phone: demo.phone,
            role: demo.role,
          },
        });

        if (error) {
          results.push({ email: demo.email, status: "error", error: error.message });
          continue;
        }
        userId = data.user.id;
        results.push({ email: demo.email, status: "created", userId });
      }

      // Upsert profile
      const profileData: Record<string, unknown> = {
        id: userId,
        first_name: demo.firstName,
        surname: demo.surname,
        display_name: demo.displayName,
        phone: demo.phone,
        email: demo.email,
        preferred_language: "English",
        role: demo.role,
        account_type: demo.accountType ?? null,
        primary_location: demo.location,
        worker_status: "available",
        identity_verified: false,
        is_available: true,
      };

      if (demo.bio !== undefined) profileData.bio = demo.bio;
      if (demo.experienceLevel !== undefined) profileData.experience_level = demo.experienceLevel;
      if (demo.experienceDetail !== undefined) profileData.experience_detail = demo.experienceDetail;
      if (demo.serviceAreas !== undefined) profileData.service_areas = demo.serviceAreas;
      if (demo.availabilityDays !== undefined) {
        profileData.availability = { days: demo.availabilityDays };
      }
      if (demo.qualificationsSummary !== undefined) {
        profileData.qualifications_summary = demo.qualificationsSummary;
      }

      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert(profileData, { onConflict: "id" });

      if (profileError) {
        results.push({ email: demo.email, status: "profile_error", error: profileError.message });
      }
    }

    // Seed worker_services for the worker
    const workerResult = results.find((r) => r.email === "sanele.b@example.co.za");
    if (workerResult?.userId) {
      const { data: services } = await adminClient.from("services").select("id, name");
      const serviceMap: Record<string, string> = {};
      (services ?? []).forEach((s: { id: string; name: string }) => {
        serviceMap[s.name] = s.id;
      });

      const workerServices = ["Plumbing", "General Labour", "Painting"];
      for (const svcName of workerServices) {
        const svcId = serviceMap[svcName];
        if (!svcId) continue;
        await adminClient
          .from("worker_services")
          .upsert(
            {
              worker_id: workerResult.userId,
              service_id: svcId,
              experience_level: "3–5 years",
              years_experience: "3–5 years",
              description:
                svcName === "Plumbing"
                  ? "Residential plumbing repairs, installations, water systems and geyser maintenance."
                  : svcName === "General Labour"
                    ? "General maintenance and labour around the Newcastle area."
                    : "Interior and exterior wall painting with surface preparation.",
              starting_price: svcName === "Plumbing" ? 450 : svcName === "General Labour" ? 300 : 350,
              pricing_type: "fixed",
              active: true,
            },
            { onConflict: "worker_id,service_id" }
          );
      }

      // Seed demo jobs for the employer
      const employerResult = results.find((r) => r.email === "thandi.m@example.co.za");
      if (employerResult?.userId) {
        const { data: existingJobs } = await adminClient
          .from("jobs")
          .select("id")
          .eq("employer_id", employerResult.userId);

        if (!existingJobs || existingJobs.length === 0) {
          const jobsToCreate = [
            {
              title: "Leaking Kitchen Tap",
              description: "The kitchen tap has been leaking continuously. Please inspect the tap and repair or replace the faulty part.",
              job_location: "Newcastle CBD",
              budget: 450,
              requested_date: "Today",
              requested_time: "14:00",
              estimated_duration: "1–2 hours",
              latitude: -27.759,
              longitude: 29.932,
              service_name: "Plumbing",
            },
            {
              title: "Garden Cleanup",
              description: "Front and back garden needs a general clean-up — hedge trimming, weeding, and removing garden refuse.",
              job_location: "Hutten Heights",
              budget: 350,
              requested_date: "Today",
              requested_time: "15:30",
              estimated_duration: "2–3 hours",
              latitude: -27.715,
              longitude: 29.948,
              service_name: null,
            },
            {
              title: "Paint Two Bedroom Walls",
              description: "Two bedroom walls need to be painted. Customer will provide paint. Surfaces need light preparation first.",
              job_location: "Madadeni",
              budget: 850,
              requested_date: "Tomorrow",
              requested_time: "09:00",
              estimated_duration: "3–4 hours",
              latitude: -27.731,
              longitude: 29.985,
              service_name: "Painting",
            },
            {
              title: "Move Furniture",
              description: "Need help moving furniture from one room to another and loading a few pieces onto a bakkie.",
              job_location: "Arbor Park",
              budget: 600,
              requested_date: "Tomorrow",
              requested_time: "11:00",
              estimated_duration: "2 hours",
              latitude: -27.771,
              longitude: 29.921,
              service_name: null,
            },
          ];

          for (const job of jobsToCreate) {
            await adminClient.from("jobs").insert({
              employer_id: employerResult.userId,
              service_id: job.service_name ? serviceMap[job.service_name] : null,
              title: job.title,
              description: job.description,
              job_location: job.job_location,
              budget: job.budget,
              pricing_type: "fixed",
              requested_date: job.requested_date,
              requested_time: job.requested_time,
              estimated_duration: job.estimated_duration,
              latitude: job.latitude,
              longitude: job.longitude,
              status: "Available",
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
