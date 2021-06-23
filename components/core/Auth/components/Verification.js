import * as React from "react";
import * as System from "~/components/system";
import * as SVG from "~/common/svg";
import * as Validations from "~/common/validations";

import Field from "~/components/core/Field";

import { AnimateSharedLayout, motion } from "framer-motion";
import { LoaderSpinner } from "~/components/system/components/Loaders";
import { css } from "@emotion/react";
import { useField } from "~/common/hooks";
import { SignUpPopover } from "~/components/core/Auth/components";

const STYLES_HELPER = (theme) => css`
  text-align: center;
  margin-top: 8px;
  font-size: ${theme.typescale.lvl0};
  color: ${theme.system.textGrayDark};
`;

const STYLES_RESEND_BUTTON = (theme) => css`
  padding: 0;
  margin: 0;
  font-size: ${theme.typescale.lvl0};
  color: ${theme.system.blue};
  border: none;
  background: transparent;
  cursor: pointer;
`;

const getResendText = ({ status, timeLeft }) => {
  if (status === "ready") return "Resend code.";
  if (status === "sending") return "Sending code...";
  if (status === "sent") return "Code sent.";
  return `Resend code in ${timeLeft}s`;
};

const ResendButton = ({ onResend }) => {
  // NOTE(amine): we have 4 status: ready, sending, sent, timeout
  const [status, setStatus] = React.useState("ready");
  const [timer, setTimer] = React.useState(35);

  const handleResend = async () => {
    if (status === "ready") {
      setStatus("sending");
      await onResend();
      setStatus("sent");
      return;
    }

    if (status === "sent") {
      setStatus("timeout");
    }
  };

  // NOTE(amine): when the timer hits 0,
  React.useEffect(() => {
    if (timer === 0) setStatus("ready");
  }, [timer]);

  React.useEffect(() => {
    let interval;
    // NOTE(amine): start a timer when the email is sent
    if (status === "sent") {
      // NOTE(amine): reset timer to 35s
      setTimer(35);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
        //NOTE(amine): clear interval when the timer is over.
        if (timer === 0) clearInterval(interval);
      }, 1000);
    }
  }, [status]);

  return (
    <System.P1 css={STYLES_RESEND_BUTTON} style={{ display: "inline" }} onClick={handleResend}>
      {getResendText({ status, timeLeft: timer })}
    </System.P1>
  );
};

const DEFAULT_TITLE = (
  <>
    Verification code sent,
    <br />
    please check your inbox.
  </>
);

export default function Verification({ onVerify, title = DEFAULT_TITLE, onResend }) {
  const { getFieldProps, isSubmitting } = useField({
    validateOnBlur: false,
    initialValue: "",
    onSubmit: async (pin) => onVerify({ pin }),
    validate: (pin) => {
      if (!Validations.verificationPin(pin)) return "Invalid pin";
    },
  });

  return (
    <SignUpPopover logoStyle={{ width: 56, height: 56 }} title={title}>
      <Field
        autoFocus
        label="Enter the 6 digit code sent to your email"
        full
        icon={
          isSubmitting
            ? () => (
                <LoaderSpinner
                  style={{ height: 16, width: 16, marginLeft: 16, position: "absolute", right: 12 }}
                />
              )
            : SVG.RightArrow
        }
        textStyle={{ width: "100% !important" }}
        containerStyle={{ marginTop: "28px" }}
        style={{ backgroundColor: "rgba(242,242,247,0.5)" }}
        name="pin"
        type="pin"
        {...getFieldProps()}
      />
      <AnimateSharedLayout>
        <motion.div layout>
          <System.P1 css={STYLES_HELPER}>
            Didn’t receive an email? <ResendButton onResend={onResend} />
          </System.P1>
        </motion.div>
      </AnimateSharedLayout>
    </SignUpPopover>
  );
}
