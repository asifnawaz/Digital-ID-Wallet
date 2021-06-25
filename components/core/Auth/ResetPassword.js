import * as React from "react";
import * as System from "~/components/system";
import * as Validations from "~/common/validations";
import * as Actions from "~/common/actions";
import * as Utilities from "~/common/utilities";
import * as SVG from "~/common/svg";

import Field from "~/components/core/Field";

import { AnimateSharedLayout, motion } from "framer-motion";
import { P1 } from "~/components/system";
import { useForm } from "~/common/hooks";
import { css } from "@emotion/react";

import { SignUpPopover, Verification } from "~/components/core/Auth/components";

const STYLES_BACK_BUTTON = css`
  background: none;
  border-style: none;
  cursor: pointer;
  margin-top: auto;
  margin-right: auto;
  span {
    display: flex;
    align-items: center;
    justify-content: center;
    & > * + * {
      margin-left: 8px;
    }
  }
`;

const handleValidation = ({ email }, errors) => {
  if (!Validations.email(email)) errors.email = "Invalid email";
  return errors;
};
const handleNewPasswordValidation = ({ password }, errors) => {
  if (!Validations.password(password)) errors.password = "Invalid Password";
  return errors;
};

const usePasswordReset = () => {
  // NOTE(amine): can be either initial || verification || new_password
  const [scene, setScene] = React.useState("initial");
  const handlers = React.useMemo(
    () => ({
      goToVerificationScene: () => setScene("verification"),
      goToNewPasswordScene: () => setScene("new_password"),
    }),
    []
  );
  return { ...handlers, scene };
};
export default function ResetPassword({
  goBack,
  createVerification,
  verifyEmail,
  resetPassword,
  resendEmailVerification,
}) {
  const [passwordValidations, setPasswordValidations] = React.useState(
    Validations.passwordForm("")
  );
  const [showPassword, toggleShowPassword] = React.useState(false);

  const { scene, goToNewPasswordScene, goToVerificationScene } = usePasswordReset();

  // NOTE(amine): Asking for email scene form
  const { getFieldProps, getFormProps, isSubmitting, values } = useForm({
    validateOnBlur: false,
    initialValues: { email: "" },
    validate: handleValidation,
    onSubmit: async ({ email }) => {
      const response = await createVerification({ email });
      if (!response) return;
      goToVerificationScene();
    },
  });

  // NOTE(amine): New password scene form
  const {
    getFieldProps: getNewPasswordFieldProps,
    getFormProps: getNewPasswordFormProps,
    isSubmitting: isNewPasswordFormSubmitting,
  } = useForm({
    validateOnBlur: false,
    initialValues: { password: "" },
    validate: handleNewPasswordValidation,
    onSubmit: async ({ password }) => {
      await resetPassword({ password });
    },
  });

  if (scene === "verification") {
    const handleVerification = async ({ pin }) => {
      const response = await verifyEmail({ pin });
      if (!response) return;
      goToNewPasswordScene();
    };
    return (
      <Verification
        title={`Password reset code sent to ${values.email}`}
        onVerify={handleVerification}
        onResend={resendEmailVerification}
      />
    );
  }

  if (scene === "new_password") {
    return (
      <SignUpPopover title={<>Enter new password</>}>
        <form {...getNewPasswordFormProps()} style={{ marginTop: 72 }}>
          <Field
            autoFocus
            containerStyle={{ marginTop: 16 }}
            placeholder="New password"
            type={showPassword ? "text" : "password"}
            full
            validations={passwordValidations}
            {...getNewPasswordFieldProps("password", {
              onChange: (e) => {
                const validations = Validations.passwordForm(e.target.value);
                setPasswordValidations(validations);
              },
            })}
            style={{ backgroundColor: "rgba(242,242,247,0.5)" }}
            onClickIcon={() => toggleShowPassword(!showPassword)}
            icon={showPassword ? SVG.EyeOff : SVG.Eye}
          />
          <AnimateSharedLayout>
            <motion.div layout>
              <System.ButtonPrimary
                full
                type="submit"
                loading={isNewPasswordFormSubmitting}
                style={{ marginTop: 16 }}
              >
                Log in with new password
              </System.ButtonPrimary>
            </motion.div>
          </AnimateSharedLayout>
        </form>
      </SignUpPopover>
    );
  }

  return (
    <SignUpPopover
      title={
        <>
          Enter your email <br /> to reset password
        </>
      }
    >
      <form {...getFormProps()} style={{ marginTop: 72 }}>
        <Field
          autoFocus
          containerStyle={{ marginTop: 16 }}
          placeholder="Email"
          name="email"
          type="email"
          full
          {...getFieldProps("email")}
          style={{ backgroundColor: "rgba(242,242,247,0.5)" }}
        />
        <AnimateSharedLayout>
          <motion.div layout>
            <System.ButtonPrimary
              full
              type="submit"
              loading={isSubmitting}
              style={{ marginTop: 16 }}
            >
              Send password reset code
            </System.ButtonPrimary>
          </motion.div>
        </AnimateSharedLayout>
      </form>
      <button css={STYLES_BACK_BUTTON} type="button" onClick={goBack}>
        <span>
          <SVG.RightArrow height="16px" style={{ transform: "rotate(180deg)" }} />
          <P1>Back</P1>
        </span>
      </button>
    </SignUpPopover>
  );
}
