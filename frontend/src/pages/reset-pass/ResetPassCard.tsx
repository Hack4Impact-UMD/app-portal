import { useState } from "react";
import { Link } from "react-router-dom";

import TextBox from "@/components/TextBox";
import { Button } from "@/components/ui/button";
import { validPassword, validCode } from "@/utils/verification";

export default function ResetPassCard() {
  const [formData, setFormData] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  });

  // check if all fields are filled
  const isFormValid =
    formData.code.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.confirmPassword.trim() !== "";

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
  const handleSubmit = () => {
    let valid = true;
    const errors = { ...formErrors };

    if (!validCode(formData.code)) {
      valid = false;
      errors.code = "Invalid Code";
    }
    if (!validPassword(formData.password)) {
      valid = false;
      errors.password =
        "Invalid Password, Please ensure your password meets the following requirements: At least 8 characters long, At least one uppercase letter (A-Z), At least one lowercase letter (a-z), At least one digit (0-9), At least one special character (e.g., @$!%*?&#).";
      errors.confirmPassword = "Invalid Password";
    }
    if (formData.password !== formData.confirmPassword) {
      valid = false;
      errors.confirmPassword = "Invalid Confirmation Password";
    }

    setFormErrors(errors);

    if (valid) {
      // reset password
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
          Reset password
        </h1>
        <p className="mt-3 text-lg text-h4i-navy/70">
          Enter the code from your email and choose a new password.
        </p>
      </div>
      <TextBox
        inputType="text"
        className="w-full"
        label="CODE"
        invalidLabel={formErrors.code}
        onChange={(e) => handleInputChange("code", e.target.value)}
      />
      <TextBox
        inputType="password"
        className="w-full"
        label="PASSWORD"
        invalidLabel={formErrors.password}
        onChange={(e) => handleInputChange("password", e.target.value)}
      />
      <TextBox
        inputType="password"
        className="w-full"
        label="CONFIRM PASSWORD"
        invalidLabel={formErrors.confirmPassword}
        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
      />
      <Button
        size="lg"
        className="mt-2 w-full"
        disabled={!isFormValid}
        type="submit"
      >
        Reset password
      </Button>
      <div className="mt-3 w-full">
        <hr className="m-0 w-full text-gray"></hr>
        <p className="mt-4 text-sm text-h4i-navy/60">
          <Link to="/login" className="text-blue">
            Back to log in
          </Link>
        </p>
      </div>
    </form>
  );
}
