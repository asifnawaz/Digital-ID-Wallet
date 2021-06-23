import * as React from "react";
import * as System from "~/components/system";
import * as Validations from "~/common/validations";
import * as Strings from "~/common/strings";
import * as Constants from "~/common/constants";
import * as SVG from "~/common/svg";
import * as Styles from "~/common/styles";

import Field from "~/components/core/Field";

import { P } from "~/components/system";
import { AnimateSharedLayout, motion } from "framer-motion";
import { useForm } from "~/common/hooks";
import { css } from "@emotion/react";
import { SignUpPopover, Verification } from "~/components/core/Auth/components";

const STYLES_BACK_BUTTON = css`
  color: ${Constants.system.textGrayDark};
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
      margin-left: 4px;
    }
  }
`;

const STYLES_FORGOT_PASSWORD_BUTTON = (theme) => css`
  display: block;
  background: none;
  border: none;
  margin: 16px auto 0px;
  padding: 8px 0;
  cursor: pointer;
  & > * {
    font-size: ${theme.typescale.lvl0};
    color: ${theme.system.blue};
  }
`;

const STYLES_MESSAGE = (theme) => css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 16px;
  border: 1px solid ${theme.system.white};
  background-color: white;
  @supports ((-webkit-backdrop-filter: blur(25px)) or (backdrop-filter: blur(25px))) {
    background-color: ${theme.system.bgBlurWhiteTRN};
    backdrop-filter: blur(75px);
  }
  padding: 8px 12px;
  border-radius: 8px;
  & > * + * {
    margin-left: 16px;
  }
`;

const STYLES_MESSAGE_PARAGRAPH = (theme) => css`
  font-size: ${theme.typescale.lvlN1};
  color: ${theme.system.blue};
`;

const STYLES_MESSAGE_BUTTON = (theme) => css`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  svg {
    color: ${theme.system.textGrayDark};
    height: 16px;
    width: 16px;
  }
`;

const handleValidation = ({ password }, errors) => {
  if (!Validations.legacyPassword(password)) errors.password = "Incorrect password";
  return errors;
};

const handleNewPasswordValidation = ({ email }, errors) => {
  if (Strings.isEmpty(email)) errors.email = "Please enter an email";
  if (!Validations.email(email)) errors.email = "Invalid email";
  return errors;
};

const useSignin = () => {
  // NOTE(amine): can be either initial || email_request || verification
  const [scene, setScene] = React.useState("initial");
  const handlers = React.useMemo(
    () => ({
      goToEmailRequestScene: () => setScene("email_request"),
      goToVerificationScene: () => setScene("verification"),
    }),
    []
  );
  return { ...handlers, scene };
};

export default function Signin({
  emailOrUsername = "",
  message,
  signin,
  createVerification,
  migrateAccount,
  goToResetPassword,
  resendEmailVerification,
  goBack,
  clearMessages,
}) {
  const { scene, goToEmailRequestScene, goToVerificationScene } = useSignin();

  const [showPassword, toggleShowPassword] = React.useState(false);

  // NOTE(amine): Signin Form
  const { getFieldProps, getFormProps, isSubmitting } = useForm({
    validateOnBlur: false,
    initialValues: { username: emailOrUsername, password: "" },
    validate: handleValidation,
    onSubmit: async ({ username, password }) => {
      const response = await signin({ username, password });
      if (response?.shouldMigrate) goToEmailRequestScene();
    },
  });

  // NOTE(amine): verify email scene form
  const {
    getFieldProps: getEmailFieldProps,
    getFormProps: getEmailFormProps,
    isSubmitting: isEmailFormSubmitting,
  } = useForm({
    validateOnBlur: false,
    initialValues: { email: "" },
    validate: handleNewPasswordValidation,
    onSubmit: async ({ email }) => {
      const response = await createVerification({ email });
      if (!response) return;
      goToVerificationScene();
    },
  });

  if (scene === "verification") {
    const handleVerification = async ({ pin }) => await migrateAccount({ pin });
    return <Verification onVerify={handleVerification} onResend={resendEmailVerification} />;
  }

  if (scene === "email_request") {
    return (
      <SignUpPopover title={`Please add an email address for ${emailOrUsername}`}>
        <form {...getEmailFormProps()} style={{ marginTop: 72 }}>
          <Field
            autoFocus
            containerStyle={{ marginTop: 16 }}
            placeholder="Email"
            name="email"
            type="email"
            full
            {...getEmailFieldProps("email")}
            style={{ backgroundColor: "rgba(242,242,247,0.5)" }}
          />
          <AnimateSharedLayout>
            <motion.div layout>
              <System.ButtonPrimary
                full
                type="submit"
                loading={isEmailFormSubmitting}
                style={{ marginTop: 16 }}
              >
                Send verification code
              </System.ButtonPrimary>
            </motion.div>
          </AnimateSharedLayout>
        </form>
      </SignUpPopover>
    );
  }
  return (
    <SignUpPopover title={`Enter Password for ${emailOrUsername}`}>
      <form {...getFormProps()} style={{ marginTop: message ? 24 : 41 }}>
        {message && (
          <div css={STYLES_MESSAGE}>
            <P1 css={STYLES_MESSAGE_PARAGRAPH}>{message}</P1>
            <button css={STYLES_MESSAGE_BUTTON} onClick={clearMessages}>
              <SVG.Dismiss />
            </button>
          </div>
        )}
        <Field
          autoFocus
          containerStyle={{ marginTop: message ? 24 : 16 }}
          placeholder="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          full
          onClickIcon={() => toggleShowPassword(!showPassword)}
          icon={showPassword ? SVG.EyeOff : SVG.Eye}
          {...getFieldProps("password")}
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
              Sign in
            </System.ButtonPrimary>
            <button type="button" onClick={goToResetPassword} css={STYLES_FORGOT_PASSWORD_BUTTON}>
              <P1 css={Styles.H5}> Forgot Password?</P1>
            </button>
          </motion.div>
        </AnimateSharedLayout>
      </form>
      <button css={STYLES_BACK_BUTTON} type="button" onClick={goBack}>
        <span>
          <SVG.RightArrow height="16px" style={{ transform: "rotate(180deg)" }} />
          <P1 css={Styles.H5}>Back</P1>
        </span>
      </button>
    </SignUpPopover>
  );
}
