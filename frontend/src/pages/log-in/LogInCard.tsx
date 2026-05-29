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
      className="flex flex-col items-center justify-center w-full p-4 max-w-[430px] min-h-screen gap-2"
    >
      <img src="h4i-logo.png" alt="h4i logo" className="h-[105px] w-[105px]" />
      <div className="flex flex-col items-center text-center w-[305px] h-[105px]">
        <h1 className="text-3xl font-bold text-black">Log In</h1>
        <h3 className="text-lg text-darkgray">
          Let's get started by filling out your information below
        </h3>
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
        className="w-full h-[73px]"
        disabled={loginMutation.isPending || !isFormValid}
        type="submit"
      >
        Log In
      </Button>
      <div className="w-full">
        <hr className="w-full text-darkgray m-0"></hr>
        <p className="text-gray-500 mt-1">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue">
            Create account
          </Link>
        </p>
      </div>
    </form>
  );
}
