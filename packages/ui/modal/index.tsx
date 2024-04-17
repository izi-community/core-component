import React, {ReactNode} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {css} from "@emotion/react";
import {CloseOutlined} from "@ant-design/icons";
import 'react-spring-bottom-sheet/dist/style.css'
import useWindowsResize from "../../hook/use-windows-resize";

const Modal = ({children, isShowing = false, onClose = () => {}}: {children: ReactNode, isShowing?: boolean, onClose: () => void;}) => {
  const {width} = useWindowsResize()
  return isShowing && (
    <div
      css={css`
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          width: 100%;
          list-style-type: none;
          z-index: 4000;
          //background: rgba(10, 10, 10, 0.44);
          top: 0;
      `}
      className="flex items-center justify-center"
    >
      <div
        // This component needs to be placed outside bottom-sheet, as bottom-sheet uses transform and thus creates a new context
        // that clips this element to the container, not allowing it to cover the full page.
        key="backdrop"
        data-rsbs-backdrop
      />
      <AnimatePresence initial={true}>
        <motion.div
          key="overlay"
          aria-modal="true"
          role="dialog"
          data-rsbs-overlay
          tabIndex={-1}
          css={css`
              width: ${width * 0.8}px;
              height: auto;
              background: white;
              margin: 10px;
              border-radius: 10px;
              position: relative;
          `}
          // @ts-ignore
          positionTransition
          initial={{opacity: 0, y: 50, scale: 0.3}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, scale: 0.5, transition: {duration: 0.2}}}
        >
          <div
            onClick={() => {
              onClose?.()
              console.log("onClose")
            }}
            className="absolute cursor-pointer z-20 sm:w-10 sm:h-10 w-8 h-8 rounded-full flex items-center justify-center top-2 right-2 bg-neutral-100">
            <CloseOutlined rev={undefined}/>
          </div>
          <div data-rsbs-content className="mt-4 w-full h-full">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Modal
