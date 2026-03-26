import { useState, useEffect } from "react";

const STORAGE_KEY = "worktracker_v2";

const defaultData = {
  dailyRate: 130,
  workDays: [],
  advances: [],
  settledAdvances: [],
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getPayWednesday() {
  // Payday = Wednesday AFTER the current Sun-Sat week
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Find the Saturday that ends this week
  const sat = new Date(d);
  sat.setDate(d.getDate() + (6 - d.getDay())); // this Saturday
  // Payday Wednesday = 4 days after that Saturday
  sat.setDate(sat.getDate() + 4);
  return sat;
}
function getWeekStart(payWed) {
  // Week starts Sunday = 11 days before payday Wednesday
  const d = new Date(payWed);
  d.setDate(d.getDate() - 11);
  return d;
}
function getWorkedDaysBetween(workDays, from, to) {
  return workDays.filter(d => {
    const date = new Date(d.date + "T00:00:00");
    // from and to are both inclusive
    return d.worked && date >= from && date <= to;
  });
}

const TABS = ["Dashboard", "Log Day", "Advances", "Paydays", "History"];

export default function App() {
  const [data, setData] = useState(defaultData);
  const [tab, setTab] = useState("Dashboard");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setData(JSON.parse(saved));
  }, []);

  const save = async (newData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const nextWed = getPayWednesday();
  const weekStart = getWeekStart(nextWed);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const totalAdvances = data.advances.reduce((s, a) => s + Number(a.amount), 0);
  const workedThisWeek = getWorkedDaysBetween(data.workDays, weekStart, nextEnd);
  const grossThisWeek = workedThisWeek.length * Number(data.dailyRate);
  const netPay = grossThisWeek - totalAdvances;

  const now = new Date();
  const daysThisMonth = data.workDays.filter(d => {
    const wd = new Date(d.date + "T00:00:00");
    return wd.getMonth() === now.getMonth() && wd.getFullYear() === now.getFullYear() && d.worked;
  });
  const overtimeThisMonth = daysThisMonth.reduce((s, d) => s + Number(d.overtime || 0), 0);
  const sundayDays = data.workDays.filter(d => d.isSunday && d.worked);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", minHeight: "100vh", background: "#0d0d0d", color: "#f0ede6" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #f5a623; border-radius: 4px; }
        input, select, textarea {
          background: #1a1a1a; border: 1.5px solid #2a2a2a; color: #f0ede6;
          border-radius: 10px; padding: 10px 14px; font-family: 'Sora', sans-serif;
          font-size: 14px; width: 100%; outline: none; transition: border 0.2s;
        }
        input:focus, select:focus, textarea:focus { border-color: #f5a623; }
        textarea { resize: vertical; min-height: 70px; }
        label { font-size: 11px; color: #666; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .btn {
          background: #f5a623; color: #0d0d0d; border: none; border-radius: 10px;
          padding: 12px 22px; font-family: 'Sora', sans-serif; font-weight: 700;
          font-size: 14px; cursor: pointer; transition: opacity 0.15s, transform 0.1s;
        }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-ghost {
          background: transparent; color: #f5a623; border: 1.5px solid #f5a623;
          border-radius: 10px; padding: 9px 16px; font-family: 'Sora', sans-serif;
          font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost:hover { background: #f5a623; color: #0d0d0d; }
        .card { background: #161616; border: 1px solid #222; border-radius: 16px; padding: 18px; margin-bottom: 12px; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
        .tag-green { background: #0d2e1a; color: #4ade80; }
        .tag-red { background: #2e0d0d; color: #f87171; }
        .tag-orange { background: #2e1a0d; color: #fb923c; }
        .tag-blue { background: #0d1a2e; color: #60a5fa; }
        .tag-purple { background: #1a0d2e; color: #c084fc; }
        .divider { height: 1px; background: #222; margin: 14px 0; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .row { display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "22px 18px 10px", borderBottom: "1px solid #1e1e1e" }}>
        <div className="row">
          <div>
            <div style={{ fontSize: 10, color: "#f5a623", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>Work Tracker</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>My Job Log 💼</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#444" }}>Next Payday</div>
            <div style={{ fontSize: 13, color: "#f5a623", fontWeight: 700 }}>
              {nextWed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} Wed
            </div>
            <div style={{ fontSize: 12, color: netPay >= 0 ? "#4ade80" : "#f87171", fontWeight: 700 }}>
              Est. ${netPay.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", overflowX: "auto", padding: "0 14px", borderBottom: "1px solid #1e1e1e", gap: 2 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", color: tab === t ? "#f5a623" : "#444",
            fontFamily: "'Sora', sans-serif", fontWeight: tab === t ? 700 : 400,
            fontSize: 13, padding: "13px 11px", cursor: "pointer", whiteSpace: "nowrap",
            borderBottom: tab === t ? "2px solid #f5a623" : "2px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "18px 14px", maxWidth: 540, margin: "0 auto" }}>
        {toast && (
          <div style={{
            position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
            background: toast.type === "success" ? "#14532d" : "#7f1d1d",
            color: "#fff", padding: "10px 22px", borderRadius: 12, fontSize: 13,
            fontWeight: 600, zIndex: 999, boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
            whiteSpace: "nowrap"
          }}>{toast.msg}</div>
        )}

        {tab === "Dashboard" && (
          <Dashboard data={data} save={save} showToast={showToast}
            totalAdvances={totalAdvances} workedThisWeek={workedThisWeek}
            grossThisWeek={grossThisWeek} netPay={netPay}
            daysThisMonth={daysThisMonth} overtimeThisMonth={overtimeThisMonth}
            sundayDays={sundayDays} nextWed={nextWed} weekStart={weekStart} weekEnd={weekEnd} />
        )}
        {tab === "Log Day" && <LogDay data={data} save={save} showToast={showToast} />}
        {tab === "Advances" && <Advances data={data} save={save} showToast={showToast} totalAdvances={totalAdvances} />}
        {tab === "Paydays" && <Paydays data={data} save={save} showToast={showToast}
          totalAdvances={totalAdvances} netPay={netPay} grossThisWeek={grossThisWeek}
          workedThisWeek={workedThisWeek} nextWed={nextWed} weekStart={weekStart} />}
        {tab === "History" && <History data={data} save={save} showToast={showToast} />}
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dashboard({ data, save, showToast, totalAdvances, workedThisWeek, grossThisWeek, netPay, daysThisMonth, overtimeThisMonth, sundayDays, nextWed, weekStart, weekEnd }) {
  const [editRate, setEditRate] = useState(false);
  const [rateInput, setRateInput] = useState(data.dailyRate);

  const saveRate = () => {
    save({ ...data, dailyRate: Number(rateInput) });
    setEditRate(false);
    showToast("Daily rate updated!");
  };

  return (
    <div>
      {/* Daily Rate */}
      <div className="card" style={{ borderColor: "#2a1a00", background: "linear-gradient(135deg, #1a1000, #161616)" }}>
        <div className="row">
          <div>
            <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>Daily Rate</div>
            {editRate ? (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)} style={{ width: 110 }} autoFocus />
                <button className="btn" onClick={saveRate} style={{ padding: "8px 14px" }}>Save</button>
              </div>
            ) : (
              <div style={{ fontSize: 30, fontWeight: 800, color: "#f5a623" }} className="mono">
                ${Number(data.dailyRate).toLocaleString()} <span style={{ fontSize: 14, color: "#666" }}>/ day</span>
              </div>
            )}
          </div>
          {!editRate && <button className="btn-ghost" onClick={() => { setEditRate(true); setRateInput(data.dailyRate); }}>Edit</button>}
        </div>
      </div>

      {/* This Week Pay Breakdown */}
      <div className="card" style={{ borderColor: "#1a2e1a", background: "#0e160e" }}>
        <div style={{ fontSize: 10, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 10 }}>
          This Week's Pay
        </div>
        <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>
          {weekStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} → {weekEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} (Sat)
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#777", fontSize: 13 }}>Days worked</span>
          <span className="mono" style={{ fontWeight: 700 }}>{workedThisWeek.length} day{workedThisWeek.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#777", fontSize: 13 }}>Calculation</span>
          <span className="mono" style={{ fontWeight: 700 }}>${Number(data.dailyRate)} × {workedThisWeek.length}</span>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#777", fontSize: 13 }}>Gross salary</span>
          <span className="mono" style={{ fontWeight: 700 }}>${grossThisWeek.toLocaleString()}</span>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#777", fontSize: 13 }}>Advances</span>
          <span className="mono" style={{ fontWeight: 700, color: "#f87171" }}>− ${totalAdvances.toLocaleString()}</span>
        </div>
        <div className="divider" />
        <div className="row">
          <span style={{ fontWeight: 700, fontSize: 15 }}>You Get (Wed)</span>
          <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: netPay >= 0 ? "#4ade80" : "#f87171" }}>
            ${netPay.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard label="Days This Month" value={daysThisMonth.length} icon="📅" color="#f5a623" />
        <StatCard label="Overtime Hrs" value={`${overtimeThisMonth}h`} icon="⏰" color="#60a5fa" />
        <StatCard label="Sunday/Extra" value={sundayDays.length} icon="🌟" color="#c084fc" />
        <StatCard label="Total Advances" value={`$${totalAdvances.toLocaleString()}`} icon="💸" color="#f87171" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }} className="mono">{value}</div>
      <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── LOG DAY ──
function LogDay({ data, save, showToast }) {
  const [form, setForm] = useState({
    date: todayStr(), worked: true, hours: 8, overtime: 0, isSunday: false, notes: ""
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.date) {
      const d = new Date(form.date + "T00:00:00");
      set("isSunday", d.getDay() === 0);
    }
  }, [form.date]);

  const submit = () => {
    if (!form.date) return showToast("Pick a date!", "error");
    const entry = { ...form, hours: Number(form.hours), overtime: Number(form.overtime) };
    let workDays = [...data.workDays];
    const idx = workDays.findIndex(d => d.date === form.date);
    if (idx >= 0) workDays[idx] = entry;
    else workDays.push(entry);
    workDays.sort((a, b) => new Date(b.date) - new Date(a.date));
    save({ ...data, workDays });
    showToast(idx >= 0 ? "Day updated! ✏️" : "Day logged! ✅");
  };

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Log a Work Day</div>
      <div className="card">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div>
            <label>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: true, label: "✅ Worked" }, { v: false, label: "❌ Absent" }].map(opt => (
                <button key={String(opt.v)} onClick={() => set("worked", opt.v)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid",
                  borderColor: form.worked === opt.v ? "#f5a623" : "#2a2a2a",
                  background: form.worked === opt.v ? "#2e1a00" : "#1a1a1a",
                  color: form.worked === opt.v ? "#f5a623" : "#555",
                  fontFamily: "'Sora', sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 13,
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
          {form.worked && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label>Hours Worked</label>
                  <input type="number" value={form.hours} min={0} max={24} onChange={e => set("hours", e.target.value)} />
                </div>
                <div>
                  <label>Overtime Hrs</label>
                  <input type="number" value={form.overtime} min={0} onChange={e => set("overtime", e.target.value)} />
                </div>
              </div>
              <div>
                <label>Day Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: false, label: "Regular" }, { v: true, label: "🌟 Sunday/Extra" }].map(opt => (
                    <button key={String(opt.v)} onClick={() => set("isSunday", opt.v)} style={{
                      flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid",
                      borderColor: form.isSunday === opt.v ? "#c084fc" : "#2a2a2a",
                      background: form.isSunday === opt.v ? "#1a0d2e" : "#1a1a1a",
                      color: form.isSunday === opt.v ? "#c084fc" : "#555",
                      fontFamily: "'Sora', sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 13,
                    }}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any remarks..." />
          </div>
          <button className="btn" onClick={submit} style={{ width: "100%" }}>Save Day</button>
        </div>
      </div>

      {form.worked && (
        <div className="card" style={{ background: "#0e1a0e", borderColor: "#1a3a1a" }}>
          <div style={{ fontSize: 10, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em" }}>This Day Earns You</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80", marginTop: 4 }} className="mono">
            ${Number(data.dailyRate).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ADVANCES ──
function Advances({ data, save, showToast, totalAdvances }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");

  const addAdvance = () => {
    if (!amount || Number(amount) <= 0) return showToast("Enter a valid amount!", "error");
    const advance = { id: Date.now(), date, amount: Number(amount), notes };
    save({ ...data, advances: [advance, ...data.advances] });
    setAmount(""); setNotes("");
    showToast("Advance recorded! 💸");
  };

  const deleteAdvance = (id) => {
    save({ ...data, advances: data.advances.filter(a => a.id !== id) });
    showToast("Removed!");
  };

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Cash Advances / Borrows</div>

      <div className="card" style={{ background: "#1a0808", borderColor: "#3a1010" }}>
        <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Owed</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: "#f87171", marginTop: 4 }} className="mono">
          ${totalAdvances.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
          {data.advances.length} advance(s) · deducted from next Wednesday
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#f5a623" }}>+ Record New Advance</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Amount ($)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label>Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason..." />
          </div>
          <button className="btn" onClick={addAdvance} style={{ width: "100%" }}>Record Advance</button>
        </div>
      </div>

      {data.advances.length === 0
        ? <div style={{ textAlign: "center", color: "#333", padding: "28px 0", fontSize: 13 }}>No advances yet 👍</div>
        : data.advances.map(a => (
          <div key={a.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#f87171", fontSize: 20 }} className="mono">${Number(a.amount).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{formatDate(a.date)}</div>
              {a.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{a.notes}</div>}
            </div>
            <button onClick={() => deleteAdvance(a.id)} style={{
              background: "#2a0a0a", border: "none", color: "#f87171",
              borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12,
              fontFamily: "'Sora', sans-serif"
            }}>Remove</button>
          </div>
        ))
      }
    </div>
  );
}

// ── PAYDAYS ──
function Paydays({ data, save, showToast, totalAdvances, netPay, grossThisWeek, workedThisWeek, nextWed, weekStart }) {
  const settleAdvances = () => {
    save({
      ...data,
      settledAdvances: [
        ...(data.settledAdvances || []),
        {
          settledOn: todayStr(),
          gross: grossThisWeek,
          advances: totalAdvances,
          net: netPay,
          daysWorked: workedThisWeek.length,
          dailyRate: data.dailyRate,
        }
      ],
      advances: [],
    });
    showToast("Payday done! Advances cleared 🎉");
  };

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Paydays (Every Wednesday)</div>

      <div className="card" style={{ background: "linear-gradient(135deg, #0a1a0a, #161616)", borderColor: "#1a3a1a" }}>
        <div style={{ fontSize: 10, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Next Payday</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, marginBottom: 14 }}>
          {nextWed.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>

        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 13 }}>Days worked this week</span>
          <span className="mono" style={{ fontWeight: 700 }}>{workedThisWeek.length} days</span>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 13 }}>Daily rate</span>
          <span className="mono" style={{ fontWeight: 700 }}>${Number(data.dailyRate).toLocaleString()}</span>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 13 }}>Gross ({workedThisWeek.length} × ${data.dailyRate})</span>
          <span className="mono" style={{ fontWeight: 700 }}>${grossThisWeek.toLocaleString()}</span>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 13 }}>Advances deducted</span>
          <span className="mono" style={{ fontWeight: 700, color: "#f87171" }}>− ${totalAdvances.toLocaleString()}</span>
        </div>
        <div className="divider" />
        <div className="row">
          <span style={{ fontWeight: 800, fontSize: 16 }}>You Receive</span>
          <span className="mono" style={{ fontSize: 28, fontWeight: 800, color: netPay >= 0 ? "#4ade80" : "#f87171" }}>
            ${netPay.toLocaleString()}
          </span>
        </div>

        {netPay < 0 && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#2a0a0a", borderRadius: 8, fontSize: 12, color: "#f87171" }}>
            ⚠️ Advances exceed salary! You still owe ${Math.abs(netPay).toLocaleString()} next week.
          </div>
        )}

        <button className="btn" onClick={settleAdvances} style={{ marginTop: 14, width: "100%", background: "#4ade80", color: "#0d0d0d" }}>
          ✅ Got Paid — Clear Advances
        </button>
      </div>

      {(data.settledAdvances || []).length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Past Paydays</div>
          {[...data.settledAdvances].reverse().map((s, i) => (
            <div key={i} className="card" style={{ opacity: 0.75 }}>
              <div className="row">
                <div>
                  <span className="tag tag-green" style={{ marginRight: 8 }}>Paid</span>
                  <span style={{ fontSize: 12, color: "#555" }}>{formatDate(s.settledOn)}</span>
                </div>
                <span className="mono" style={{ fontWeight: 700, color: "#4ade80", fontSize: 16 }}>${s.net?.toLocaleString() ?? "—"}</span>
              </div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
                {s.daysWorked} days × ${s.dailyRate} = ${s.gross?.toLocaleString()} − ${s.advances?.toLocaleString()} advances
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HISTORY ──
function History({ data, save, showToast }) {
  const [filter, setFilter] = useState("all");

  const filtered = data.workDays.filter(d => {
    if (filter === "worked") return d.worked;
    if (filter === "absent") return !d.worked;
    if (filter === "sunday") return d.isSunday;
    if (filter === "overtime") return Number(d.overtime) > 0;
    return true;
  });

  const deleteDay = (date) => {
    save({ ...data, workDays: data.workDays.filter(d => d.date !== date) });
    showToast("Entry deleted!");
  };

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Work History</div>

      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
        {[["all","All"],["worked","Worked"],["absent","Absent"],["sunday","🌟 Sunday"],["overtime","Overtime"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "6px 13px", borderRadius: 20, border: "1.5px solid",
            borderColor: filter === k ? "#f5a623" : "#2a2a2a",
            background: filter === k ? "#2e1a00" : "#1a1a1a",
            color: filter === k ? "#f5a623" : "#555",
            fontFamily: "'Sora', sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 12
          }}>{label}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign: "center", color: "#333", padding: "28px 0", fontSize: 13 }}>No entries found.</div>
        : filtered.map(d => (
          <div key={d.date} className="card">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{formatDate(d.date)}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <span className={`tag ${d.worked ? "tag-green" : "tag-red"}`}>{d.worked ? "Worked" : "Absent"}</span>
                  {d.isSunday && <span className="tag tag-purple">🌟 Sunday</span>}
                  {Number(d.overtime) > 0 && <span className="tag tag-blue">OT {d.overtime}h</span>}
                  {d.worked && <span className="tag tag-orange">{d.hours}h</span>}
                  {d.worked && <span className="tag tag-green mono">${Number(data.dailyRate).toLocaleString()}</span>}
                </div>
                {d.notes && <div style={{ fontSize: 12, color: "#555", marginTop: 7 }}>📝 {d.notes}</div>}
              </div>
              <button onClick={() => deleteDay(d.date)} style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#444",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 11, marginLeft: 8
              }}>✕</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
