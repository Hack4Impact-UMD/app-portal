import { sendPasswordResetEmail } from "firebase/auth";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      className="flex flex-col items-center justify-around p-4 w-full max-w-[430px] h-[500px]"
    >
      <img src="h4i-logo.png" alt="h4i logo" className="h-[105px] w-[105px]" />
      <div className="flex flex-col items-center text-center justify-around w-[305px] h-[105px]">
        <h1 className="text-3xl font-bold">Forgot Password?</h1>
        <h3 className="text-lg text-darkgray">
          No worries! You will recieve an email to reset your account.
        </h3>
      </div>
      <TextBox
        inputType="text"
        className="w-full"
        label="EMAIL"
        invalidLabel={formErrors.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
      />
      <Button className="w-full h-[73px]" disabled={!isFormValid} type="submit">
        Send Reset Email
      </Button>
      <div className="w-full">
        <hr className="w-full text-darkgray m-0"></hr>
      </div>
    </form>
  );
}
