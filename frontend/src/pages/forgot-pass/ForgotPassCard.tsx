import { sendPasswordResetEmail } from "firebase/auth";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import TextBox from "@/components/TextBox";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwWarningToast } from "@/components/toasts/WarningToast";
import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase";
import { validEmail } from "@/utils/verification";

export default function ForgotPassCard() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
  });

  // check if all fields are filled
  const isFormValid = formData.email.trim() !== "";

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
  const handleSubmit = useCallback(async () => {
    let valid = true;
    const errors = { ...formErrors };

    if (!validEmail(formData.email)) {
      valid = false;
      errors.email =
        "Please ensure your email ends with @terpmail.umd.edu, @umd.edu, or @hack4impact.org";
    }

    setFormErrors(errors);

    if (valid) {
      try {
        await sendPasswordResetEmail(auth, formData.email);
        throwWarningToast(
          `If an account is registered under ${formData.email}, you will receive a password reset link`,
        );
        navigate("/login");
      } catch (err) {
        console.log(err);
        throwErrorToast(
          `Failed to send password reset email to ${formData.email}!`,
        );
      }
    } else {
      throwErrorToast(errors.email);
    }
  }, [formData.email, formErrors, navigate]);

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
          Forgot password?
        </h1>
        <p className="mt-3 text-lg text-h4i-navy/70">
          No worries! Enter your email and we'll send you a link to reset your
          password.
        </p>
      </div>
      <TextBox
        inputType="text"
        className="w-full"
        label="EMAIL"
        invalidLabel={formErrors.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
      />
      <Button
        size="lg"
        className="mt-2 w-full"
        disabled={!isFormValid}
        type="submit"
      >
        Send reset email
      </Button>
      <div className="mt-3 w-full">
        <hr className="m-0 w-full text-gray"></hr>
        <p className="mt-4 text-sm text-h4i-navy/60">
          Remembered it?{" "}
          <Link to="/login" className="text-blue">
            Back to log in
          </Link>
        </p>
      </div>
    </form>
  );
}
