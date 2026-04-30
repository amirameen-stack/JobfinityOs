import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { SquareTerminal, ArrowRight } from "lucide-react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import { toast } from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) { 
      toast.error("Email and password are required");
      setError("Email and password are required"); 
      return; 
    }

    try {
      setError("");
      setIsLoading(true);
      await login(email, password); 
      toast.success("Welcome back! Logged in successfully.");
      navigate("/");
    } catch (err: unknown) {
      let msg = "Something went wrong";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || "Login failed";
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#071325]">
      <nav className="flex justify-between bg-[#0B1729] px-6 py-2 text-sm">
        <div className="flex justify-center items-center gap-5 text-[#6FA3B8]">
          <NavLink to="/login" className="text-white text-xl font-bold">
            JobfinityOS
          </NavLink>
        </div>
        <div className="flex justify-center items-center gap-5 text-[#6FA3B8]">
          <NavLink to="/login" className="text-white">
            Support
          </NavLink>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-6 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-[#0F1E35] border border-[#195AAF] rounded-xl p-10 shadow-sm shadow-[#195AAF]"
        >
          <div className="flex flex-col  gap-6 w-full">
            <div className="bg-[#415371] px-4 py-4 rounded-xl w-fit mx-auto">
              <SquareTerminal size={30} className="text-[#ACC7FF]" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-2xl font-semibold">Welcome Back</p>
              <p className="text-[#878FA1]">
                Access your high-performance workspace.
              </p>
            </div>

            <div>
              <div className="flex flex-col space-y-4">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#AEB3C2] text-xs font-semibold tracking-wider">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="text"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 bg-[#09162A] border border-[#424753] rounded-md text-sm text-white placeholder-[#424753] outline-none focus:border-black-600 focus:ring-1 focus:ring-black-600 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[#AEB3C2] text-xs font-semibold tracking-wider">
                      PASSWORD
                    </label>
                    <span className="text-[#1957A9] text-xs font-semibold tracking-wider">
                      <NavLink to="/reset">FORGOT PASSWORD?</NavLink>
                    </span>
                  </div>

                  <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 bg-[#09162A] border border-[#424753] rounded-md text-sm text-white placeholder-[#424753] outline-none focus:border-black-600 focus:ring-1 focus:ring-black-600 transition-all"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                )}
              </div>
            </div>

            <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-[#1E6FD9] text-white rounded-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing in..." : "Sign In"}
        {!isLoading && <ArrowRight size={18} />}
      </button>

            {/* <div className='flex items-center gap-2 p-4 bg-[#151B46] text-[#CDBDFF] border border-[#1d2244] rounded-xl'>
                        <Sparkles size={30}/>
                        <p className='text-sm'><span className='font-semibold'>SYSTEM ALERT:</span> login security is now enhanced with  biometric verification for Pro account</p>
                    </div> */}
          </div>
        </form>
      </main>

      <footer className="flex flex-col md:flex-row justify-between items-center bg-[#071325] text-[#AEB3C2] text-xs tracking-wider px-4 md:px-6 py-3 gap-3 md:gap-0 text-center md:text-left">
        <div>
          <p>© 2024 JOBFINITYOS. BUILT FOR HIGH PERFORMANCE TEAMS.</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-6 md:gap-10">
          <NavLink to="/login">PRIVACY POLICY</NavLink>
          <NavLink to="/login">TERMS OF SERVICE</NavLink>
          <NavLink to="/login">SECURITY</NavLink>

          <div className="text-[#347A51] flex gap-2 items-center justify-center">
            <span>●</span>
            <NavLink to="/login">SYSTEM STATUS: OPTIMAL</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
