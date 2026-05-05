import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/axios";
import axios from "axios";
import { toast } from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.username) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await api.post("/auth/register", form);
      toast.success("Account created! You can now log in.");
      navigate("/login");
    } catch (err: unknown) {
      let msg = "Registration failed";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      toast.error(msg);
      console.log(msg);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071325] text-white">
      <form
        onSubmit={handleRegister}
        className="bg-[#0F1E35] p-8 rounded-xl w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Register</h2>

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="w-full p-2 bg-[#09162A] border rounded"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-2 bg-[#09162A] border rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 bg-[#09162A] border rounded"
        />

        <button className="w-full bg-blue-600 py-2 rounded">Register</button>
      </form>
    </div>
  );
};

export default Register;
