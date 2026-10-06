import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ShieldCheck} from "lucide-react";
import API from "../axios/axios";
import { useAuth } from "../context/AuthContext";

const LoginForm = () => {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); 
    const [showPassword, setShowPassword] = useState(false); //sp
    const navigate = useNavigate();
    const {login} = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
     try {
      const res = await API.post("/user/login", form);
     
      if (res.data.success) {
      
        login(res.data.user); // set user context
        navigate('/'); // redirect
  }
   else {
      setError(res.data.message || "Login failed");
    }
    } catch (err) {
     setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false); // ✅ reset loading always
    }
  };

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Top Brand Header */}
          <div className="px-8 pt-8 pb-6 bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  SanctionDMS
                </h1>
                <p className="text-xs text-slate-400">
                  Sanction Document Management System
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in with your username and password to access sanction records,
              compliance checklists, and PDF documents.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                Username
              </label>
              <input
                id="email"
                type="text"
                required
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your Username"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

             {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-sm transition-colors cursor-pointer"
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

          </form>
        </div>
      </div>
    );
  
//   return (
  
//        <div className="min-h-screen flex items-center justify-center px-4
//     bg-gradient-to-br from-[#00b090] via-[#00a080] to-[#008361]">
//       <div className="w-full max-w-md">
//         <div className="bg-[hsl(var(--card))] shadow-[var(--shadow-elevated)] rounded-2xl p-8">
//           <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))] mb-6">
//             Login
//           </h2>
//           <form onSubmit={handleSubmit} className="space-y-5">
//             {/* Email */}
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1"
//               >
//                 Username
//               </label>
//               <input
//                 type="text"
//                 id="email"
//                 name="username"
//                 value={form.username}
//                 onChange={handleChange}
//                 required
//                 placeholder="you@example.com"
//                 className="w-full px-4 py-2 rounded-lg border border-[hsl(var(--border))]
//                   bg-[hsl(var(--input))] text-[hsl(var(--foreground))]
//                   focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
//                   transition-[var(--transition-smooth)]"
//               />
//             </div>

//             {/* Password */}
       
//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1"
//               >
//                 Password
//               </label>

//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   name="password"
//                   value={form.password}
//                   onChange={handleChange}
//                   required
//                   placeholder="••••••••"
//                   className="w-full px-4 py-2 pr-10 rounded-lg border border-[hsl(var(--border))]
//                     bg-[hsl(var(--input))] text-[hsl(var(--foreground))]
//                     focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
//                     transition-[var(--transition-smooth)]"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </button>
//               </div>
//             </div>
//                  {error && <p style={{color:'red'}}>{error}</p>}
//             {/* Login Button */}
//             <button
//               disabled={loading}
//               type="submit"
//               className="w-full py-2.5 rounded-lg font-medium
//                 text-[hsl(var(--primary-foreground))]
//                 bg-[hsl(var(--primary))] shadow-[var(--shadow-construction)]
//                 hover:bg-[hsl(var(--primary-dark))]
//                 transition-[var(--transition-bounce)]"
//             >
//              {loading ? "Logging in..." : "LOGIN"}
//             </button>
//           </form>

//           {/* Extra Links */}
//           {/* <div className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
//             <a
//               href="#"
//               className="text-[hsl(var(--secondary))] hover:underline"
//             >
//               Forgot password?
//             </a>
//           </div> */}
//         </div>
//       </div>
//     </div>
//   );
};

export default LoginForm;