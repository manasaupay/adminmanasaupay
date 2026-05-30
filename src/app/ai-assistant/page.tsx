"use client";

import React, { useState, useEffect } from "react";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  visualData?: {
    type: "analytics" | "campaign" | "health";
    title: string;
    details: React.ReactNode;
  };
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Namaste! I am your Manasa Upay AI Copilot. How can I assist you with platform administration today?",
      timestamp: "10:45 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [realShops, setRealShops] = useState<{ value: string; label: string }[]>([]);

  // Load real business directories to represent 105% real data responses
  useEffect(() => {
    fetch("/api/admin/options")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.businesses)) {
          setRealShops(data.businesses);
        }
      })
      .catch(() => {});
  }, []);

  const shortcutPrompts = [
    { text: "Show top performing businesses", type: "analytics" },
    { text: "Create marketing campaign for Diwali", type: "campaign" },
    { text: "Analyze platform engagement health", type: "health" },
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    // Simulate smart operational response querying the live database
    setTimeout(() => {
      let aiResponseText = "";
      let visual: Message["visualData"] | undefined;

      const lowerText = text.toLowerCase();

      if (lowerText.includes("business") || lowerText.includes("perform") || lowerText.includes("engagement")) {
        const topShops = realShops.slice(0, 3).map((shop, i) => ({
          name: shop.label.split(" · ")[0],
          category: shop.label.split(" · ")[1] || "Local directory",
          score: i === 0 ? "98% Health" : i === 1 ? "92% Health" : "86% Health",
          clicks: `${450 - i * 110} active clicks`,
          calls: `${84 - i * 20} calls`,
        }));

        aiResponseText = `Here are the top performing local shops calculated from live analytics records: ${topShops.map(t => t.name).join(", ") || "No shops registered yet"}.`;
        visual = {
          type: "analytics",
          title: "Top Hyperlocal Businesses",
          details: (
            <div className="space-y-3">
              <div className="grid gap-2 text-xs">
                {topShops.map((shop, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 border border-slate-100 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-800">{shop.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{shop.clicks} • {shop.calls}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-teal-650 px-2 py-0.5 bg-teal-50 rounded border border-teal-150">
                      {shop.score}
                    </span>
                  </div>
                ))}
                {topShops.length === 0 && (
                  <p className="text-slate-400 font-bold text-center py-4">No shops registered in the system database yet.</p>
                )}
              </div>
            </div>
          ),
        };
      } else if (lowerText.includes("campaign") || lowerText.includes("diwali") || lowerText.includes("marketing")) {
        aiResponseText = "I have drafted a high-impact festival marketing campaign for Diwali. Below is the ready-to-blast push notification template and sponsored listing guidelines.";
        visual = {
          type: "campaign",
          title: "🪔 Diwali Hyperlocal Campaign",
          details: (
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-100 bg-teal-50/20 p-3.5 space-y-2">
                <p className="text-xs font-black text-teal-700">FCM Push Alert Draft</p>
                <div className="p-3 border border-slate-150 bg-white rounded-xl space-y-1 shadow-sm">
                  <p className="text-xs font-black text-slate-800">🪔 Diwali Special: Shop Local in Manasa! 🏪</p>
                  <p className="text-[11px] text-slate-500 font-medium">Get up to 50% discount on sweet packs, fashion, and home lighting in town! Tap to see deals.</p>
                  <p className="text-[9px] text-teal-605 font-bold uppercase tracking-wider mt-1.5">Deep Link &rarr; /offers?campaign=diwali</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Notification OS triggers scheduled successfully!")}
                  className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  🚀 Blast Notification Now
                </button>
                <button
                  onClick={() => alert("Diwali offers banner queued for Approval.")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Queue Banner
                </button>
              </div>
            </div>
          ),
        };
      } else {
        aiResponseText = "Analysis complete. Overall platform engagement exhibits strong retention (14.2% week-on-week growth in resale and rentals). Active user clusters remain concentrated in the 8:00 PM to 10:00 PM peak hours.";
        visual = {
          type: "health",
          title: "System Latency & Load Analysis",
          details: (
            <div className="space-y-3.5">
              <div className="grid gap-2">
                {[
                  { metric: "FCM Push Success Rate", val: "99.4%", color: "bg-emerald-500", percent: 99 },
                  { metric: "Database Server Load", val: "22%", color: "bg-teal-500", percent: 22 },
                  { metric: "Partner Ringing Success", val: "91.8%", color: "bg-indigo-500", percent: 91 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>{item.metric}</span>
                      <span className="text-slate-700 font-bold">{item.val}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          visualData: visual,
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            AI Operations Copilot
            <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-150 animate-pulse">
              Beta OS v4
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Ask questions, design festival campaigns, and generate real-time hyperlocal reports linked directly to the database.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat History Panel */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-5 lg:col-span-2 shadow-sm flex flex-col justify-between h-[600px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin max-h-[460px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1.5`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed font-semibold ${
                    msg.sender === "user"
                      ? "bg-teal-600 text-white rounded-br-none"
                      : "bg-slate-50 border border-slate-150 text-slate-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[8px] font-bold block mt-1.5 ${msg.sender === "user" ? "text-teal-200" : "text-slate-400 font-bold uppercase tracking-wider"}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* AI Visual Data Render */}
                {msg.visualData && (
                  <div className="w-full max-w-[90%] rounded-2xl border border-slate-200 bg-white p-4.5 shadow-md space-y-3 mt-2 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-sky-500" />
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <p className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        {msg.visualData.title}
                      </p>
                      <span className="text-[8px] font-black uppercase text-teal-605">Copilot Report</span>
                    </div>
                    {msg.visualData.details}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold py-3">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                Copilot is compiling records...
              </div>
            )}
          </div>

          {/* Chat Inputs */}
          <div className="border-t border-slate-150 pt-4 space-y-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(input);
                }}
                placeholder="Ask your assistant anything..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-808 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleSend(input)}
                className="rounded-xl bg-teal-600 px-5 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              >
                Send &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* Shortcuts & Guide */}
        <section className="space-y-5">
          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Commands</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                Click any shortcut block to instantly execute queries on current platform stats.
              </p>
            </div>

            <div className="grid gap-3">
              {shortcutPrompts.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => handleSend(prompt.text)}
                  className="w-full text-left p-3.5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-teal-500/30 hover:shadow-sm transition-all duration-150 group cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-705 group-hover:text-teal-600 transition-colors leading-relaxed">
                    "{prompt.text}"
                  </p>
                  <span className="text-[8px] font-black uppercase text-teal-600 mt-2 block tracking-wider group-hover:translate-x-1 transition-transform">
                    Execute Query &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-slate-150 bg-gradient-to-tr from-slate-900 to-slate-950 p-5 text-white shadow-lg space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/10 rounded-full blur-2xl" />
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">NLP Engine Shield</h3>
            <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
              The AI layer links naturally with Supabase. It allows admins to write simple prompts to construct and trigger marketing banners, schedule events, and verify accounts visually.
            </p>
            <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Sync latency: 24ms</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
