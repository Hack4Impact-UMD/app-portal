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
      className="flex w-full max-w-md flex-col gap-3"
    >
      <div className="mb-5">
        <h1 className="text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl">
          Create an account
        </h1>
        <p className="mt-3 text-lg text-h4i-navy/70">
          Let's get started by filling out your information below.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <TextBox
          className="min-w-0 sm:flex-1"
          inputType="text"
          label="FIRST NAME"
          invalidLabel={formErrors.firstName}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
        />
        <TextBox
          className="min-w-0 sm:flex-1"
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
        size="lg"
        className="mt-2 w-full"
        disabled={signUpMutation.isPending || !isFormValid}
        type="submit"
      >
        Create account
      </Button>
      <div className="mt-3 w-full">
        <hr className="m-0 w-full text-gray"></hr>
        <p className="mt-4 text-sm text-h4i-navy/60">
          Already have an account?{" "}
          <Link to="/login" className="text-blue">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
