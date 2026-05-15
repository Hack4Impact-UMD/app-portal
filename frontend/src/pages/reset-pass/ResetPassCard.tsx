import { useState } from "react";
import TextBox from "../../components/TextBox";
import { Button } from "../../components/ui/button";
import { validPassword, validCode } from "../../utils/verification";

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
      className="flex items-center justify-center min-h-screen bg-white"
    >
      <div className="flex flex-col items-center justify-around w-full p-4 max-w-[430px] h-[700px]">
        <img
          src="h4i-logo.png"
          alt="h4i logo"
          className="h-[105px] w-[105px]"
        />
        <div className="flex flex-col items-center text-center justify-around w-[305px] h-[105px]">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <h3 className="text-lg text-darkgray">
            Fill in the code you recieved in your email
          </h3>
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
          className="w-full h-[73px]"
          disabled={!isFormValid}
          type="submit"
        >
          {" "}
          Reset{" "}
        </Button>
        <hr className="w-full text-darkgray m-0"></hr>
      </div>
    </form>
  );
}
