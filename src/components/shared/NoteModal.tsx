'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  note: string | null;
  title?: string;
  onClose: () => void;
}

export default function NoteModal({
  isOpen,
  note,
  title = 'Booking Note',
  onClose,
}: NoteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm text-purple-100">Client note details</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
                aria-label="Close note modal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-700">
                  Note
                </p>
                <p className="whitespace-pre-wrap break-words text-gray-900">
                  {note?.trim() ? note : 'No note added for this booking.'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
