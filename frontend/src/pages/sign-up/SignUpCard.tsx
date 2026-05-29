import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import TextBox from "@/components/TextBox";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/services/userService";
import { validEmail, validPassword } from "@/utils/verification";

export default function SignUpCard() {
  const signUpMutation = useMutation({
    mutationFn: async (formData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      return await registerUser(
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.password,
      );
    },
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    genericError: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // check if all fields are filled
  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "";

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
  // TODO: make variables less messy; unsure how to save server errors as in LogInCard
  const handleSubmit = async () => {
    let valid = true;
    const errors = { ...formErrors };

    if (!validEmail(formData.email)) {
      valid = false;
      const errorMessage = "Invalid Email.";
      errors.email = errorMessage;
      throwErrorToast(errorMessage);
    }

    if (!validPassword(formData.password)) {
      valid = false;
      const errorMessage =
        "Invalid Password, Please ensure your password meets the following requirements: At least 8 characters long, At least one uppercase letter (A-Z), At least one lowercase letter (a-z), At least one digit (0-9), At least one special character (e.g., @$!%*?&#).";
      errors.password = errorMessage;
      throwErrorToast(errorMessage);
    }

    setFormErrors(errors);

    if (valid) {
      try {
        await signUpMutation.mutateAsync(formData);

        setFormErrors({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          genericError: "",
        });
      } catch (error) {
        const serverErrors = {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          genericError: "",
        };
        if (error instanceof AxiosError) {
          if (error.response?.data.error === "Invalid Data") {
            error.response?.data.details.map(
              (issue: {
                field: "firstName" | "lastName" | "email";
                message: string;
              }) => {
                throwErrorToast(
                  `[Server validation error] ${issue.field}: ${issue.message}`,
                );
                serverErrors[issue.field] = issue.message;
              },
            );
          }
        } else if (error instanceof Error) {
          serverErrors.genericError = error.message;
        } else {
          serverErrors.genericError =
            "Failed to register. You should contact us.";
        }
        setFormErrors(serverErrors);
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
      className="flex flex-col items-center justify-around w-full max-w-[430px] h-[700px] p-4"
    >
      <img src="h4i-logo.png" alt="h4i logo" className="h-[105px] w-[105px]" />
      <div className="flex flex-col items-center text-center justify-around w-[305px] h-[105px]">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <h3 className="text-lg text-darkgray">
          Let's get started by filling out your information below
        </h3>
      </div>

      <div className="max-w-full w-full flex flex-col justify-between sm:flex-row ">
        <TextBox
          className="mb-2 sm:w-[193px] sm:mb-0"
          inputType="text"
          label="FIRST NAME"
          invalidLabel={formErrors.firstName}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
        />
        <TextBox
          className="sm:w-[193px]"
          inputType="text"
          label="LAST NAME"
          invalidLabel={formErrors.lastName}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
        />
      </div>
      <TextBox
        inputType="text"
        className="w-full"
        label="EMAIL (@umd.edu, @terpmail.umd.edu, or @hack4impact.org)"
        invalidLabel={formErrors.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
      />
      <div className="relative flex items-center w-full">
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
            <EyeOff className="size-5" />
          ) : (
            <Eye className="size-5" />
          )}
        </button>
      </div>
      <Button
        className="w-full h-[73px]"
        disabled={signUpMutation.isPending || !isFormValid}
        type="submit"
      >
        Create Account
      </Button>
      <div className="w-full">
        <hr className="w-full text-darkgray m-0"></hr>
        <p className="text-darkgray mt-1">
          Already have an account?{" "}
          <Link to="/login" className="text-blue">
            Log In
          </Link>
        </p>
      </div>
    </form>
  );
}
