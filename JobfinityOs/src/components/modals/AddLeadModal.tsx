import { useState} from "react";  
import { api } from "../../api/axios";
import type { Lead } from "../../services/leadService";
import { toast } from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}
// ... (omitting constants for brevity, but they will be preserved by replace_file_content if I specify the range correctly)
// Wait, I should include the constants if they are in the range.

// Let's just target the handleSubmit function for precision.


const COMPANY_SIZES = ["0 - 9", "10 - 49", "50 - 199", "200 - 499", "500 - 999", "1000+"];
const REVENUE_RANGES = ["< $1M", "$1M - $10M", "$10M - $25M", "$25M - $50M", "$50M - $100M", "$100M+"];
const JOB_LEVELS = ["Individual Contributor", "Manager", "Director", "VP", "CXO", "Founder", "Other"];
const JOB_DEPARTMENTS = ["CEO", "Sales", "Marketing", "Engineering", "Product", "Finance", "HR", "Operations", "Legal", "Other"];

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 pb-1 border-b border-white/10">
      <span className="text-base">{icon}</span>
      <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">{title}</span>
    </div>
    <div className="grid grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field = ({
  label, name, value, onChange, placeholder = "", type = "text", full = false, as = "input", options = [],
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string; type?: string; full?: boolean; as?: "input" | "select"; 
  options?: (string | { label: string; value: string })[];
}) => (
  <div className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
    <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">{label}</label>
    {as === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                   focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all
                   appearance-none cursor-pointer hover:border-white/20"
      >
        <option value="" className="bg-[#0a1628]">Select…</option>
        {options.map(o => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          return <option key={val} value={val} className="bg-[#0a1628]">{lab}</option>;
        })}
      </select>
    ) : (
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                   placeholder:text-white/20 focus:outline-none focus:border-blue-500/60
                   focus:bg-white/8 transition-all hover:border-white/20"
      />
    )}
  </div>
);

export default function AddLeadModal({ open, onClose, onAdd }: Props) {
  const [form, setForm] = useState({
    company_name: "", url: "", company_size: "", revenue_range: "", company_country: "",
    contact_name: "", job_title: "", job_department: "", job_level: "",
    email: "", phone: "", linkedin: "", twitter: "",
    address: "", city: "", state: "", country: "",
    folder_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.company_name || !form.contact_name || !form.email) {
      toast.error("Company name, contact name and email are required.");
      setError("Company name, contact name and email are required.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        folder_id: form.folder_id || null,   // ← send null if not selected
      };
      const res = await api.post("/leads", payload);
      onAdd(res.data.data);
      toast.success("Lead added successfully!");
      onClose();
    } catch (err: unknown) {
      let msg = "Something went wrong.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-500 flex items-start justify-center overflow-y-auto px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl text-white shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #0d1f38 0%, #0a1628 60%, #0c1a30 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Add New Lead</h2>
            <p className="text-xs text-white/40 mt-0.5">Fill in the details to create a new lead</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center
                       text-white/50 hover:text-white transition-all text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto custom-scroll">

          <Section title="Company Info" icon="🏢">
            <Field label="Company Name *" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Inc." full />
            <Field label="Website URL" name="url" value={form.url} onChange={handleChange} placeholder="acme.com" />
            <Field label="Company Size" name="company_size" value={form.company_size} onChange={handleChange} as="select" options={COMPANY_SIZES} />
            <Field label="Revenue Range" name="revenue_range" value={form.revenue_range} onChange={handleChange} as="select" options={REVENUE_RANGES} />
            <Field label="Company Country" name="company_country" value={form.company_country} onChange={handleChange} placeholder="United States" full />
          </Section>

          <Section title="Contact Details" icon="👤">
            <Field label="Contact Name *" name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="John Smith" full />
            <Field label="Job Title" name="job_title" value={form.job_title} onChange={handleChange} placeholder="Head of Sales" />
            <Field label="Department" name="job_department" value={form.job_department} onChange={handleChange} as="select" options={JOB_DEPARTMENTS} />
            <Field label="Job Level" name="job_level" value={form.job_level} onChange={handleChange} as="select" options={JOB_LEVELS} />
          </Section>

          <Section title="Contact Info" icon="📬">
            <Field label="Email *" name="email" value={form.email} onChange={handleChange} placeholder="john@acme.com" type="email" />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" type="tel" />
            <Field label="LinkedIn" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="linkedin.com/in/john" />
            <Field label="Twitter / X" name="twitter" value={form.twitter} onChange={handleChange} placeholder="twitter.com/john" />
          </Section>

          <Section title="Location" icon="📍">
            <Field label="Address" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" full />
            <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="New York" />
            <Field label="State / Region" name="state" value={form.state} onChange={handleChange} placeholder="New York" />
            <Field label="Country" name="country" value={form.country} onChange={handleChange} placeholder="United States" full />
          </Section>

          

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between gap-3">
          <span className="text-xs text-red-400 min-h-[1rem]">{error}</span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white
                         hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all
                         shadow-lg shadow-blue-500/20"
            >
              {loading ? "Saving…" : "Save Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}