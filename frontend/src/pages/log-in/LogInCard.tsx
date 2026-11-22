import { PermissionRole } from "@app-portal/shared/constants";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import TextBox from "@/components/TextBox";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function LogInCard() {
  const { login } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return await login(email, password);
    },
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // check if all fields are filled
  const isFormValid =
    formData.email.trim() !== "" && formData.password.trim() !== "";

  // handle TextBox input changes
  const handleInputChange = (field: string, value: string) => {
    const updatedData = {
      ...formData,
      [field]: value, //adding OR updating a specific field with new value
    };

    setFormData(updatedData);

    const updatedErrors = {
      ...formErrors,
      [field]: "",
    };

    setFormErrors(updatedErrors);
  };

  // using dummy conditionals for now
  const handleSubmit = async () => {
    const valid = true;
    const errors = { ...formErrors };

    setFormErrors(errors);

    if (valid) {
      try {
        const user = await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });
        if (state && state.path) {
          navigate(state.path);
        } else {
          if (user.role === PermissionRole.Applicant) {
            navigate("/apply");
          } else {
            navigate("/admin");
          }
        }
      } catch (error) {
        console.log("Failed to login!");
        console.log(error);
        const errorMessage = "Failed to login, check your email and password.";
        setFormErrors({
          email: errorMessage,
          password: "",
        });

        throwErrorToast(errorMessage);
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }}
      className="flex w-full max-w-md flex-col gap-2"
    >
      <div className="mb-6">
        <h1 className="text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl">
          Log in
        </h1>
        <p className="mt-3 text-lg text-h4i-navy/70">
          Welcome back! Continue your application or check your status.
        </p>
      </div>
      <TextBox
        inputType="text"
        className="w-full mb-2"
        label="EMAIL"
        invalidLabel={formErrors.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
      />
      <div className="w-full relative">
        <div className="relative flex items-center">
          <TextBox
            inputType={showPassword ? "text" : "password"}
            className="w-full flex-1"
            label="PASSWORD"
            invalidLabel={formErrors.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-gray-500 cursor-pointer bg-lightgray h-12"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="w-full flex justify-end mb-2">
          <Link to="/forgotpassword" className="text-blue">
            Forgot password?
          </Link>
        </div>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={loginMutation.isPending || !isFormValid}
        type="submit"
      >
        Log in
      </Button>
      <div className="mt-4 w-full">
        <hr className="m-0 w-full text-gray"></hr>
        <p className="mt-4 text-sm text-h4i-navy/60">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue">
            Create account
          </Link>
        </p>
      </div>
    </form>
  );
}
