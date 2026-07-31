import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function LoadingScreen({ isLoaded, children }) {
  return (
    <AnimatePresence mode="wait">
      {!isLoaded ? (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <Logo size="xl" />
            <motion.div
              className="mt-6 w-32 h-1 bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
