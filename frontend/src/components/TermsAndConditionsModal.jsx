/* eslint-disable react/prop-types */
import React from "react";

const TermsAndConditionsModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gray-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold">Terms & Conditions</h3>
            <p className="text-xs text-gray-300">Aama Clothings — Customer Agreement & Policies</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body (Scrollable Mock Terms) */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-600 leading-relaxed font-normal">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs">
            <strong>Important Notice:</strong> By creating an account, browsing our store, or placing an order on Aama Clothings, you agree to be bound by the terms, conditions, and policies set forth below.
          </div>

          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-1">1. Account Registration & User Security</h4>
            <p>
              When registering for an account, you agree to provide accurate, current, and complete information (including your legal first name, last name, email address, and mobile phone number). You are solely responsible for safeguarding your login credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-1">2. Products, Pricing & Stock Availability</h4>
            <p>
              We make every effort to display the colors, fabrics, and sizes of our products accurately. Prices and stock availability are subject to change without prior notice. Products in your cart are not reserved until checkout is completed.
            </p>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-1">3. Ordering, Checkout & Payment</h4>
            <p>
              When placing an order via Cash on Delivery (COD) or other electronic payment methods, you enter into a binding purchase contract. We reserve the right to cancel any order in the event of suspected fraudulent activity, stock discrepancies, or delivery restrictions.
            </p>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-1">4. Returns, Exchanges & 7-Day Guarantee</h4>
            <p>
              Items may be returned or exchanged within 7 days of delivery, provided they remain unworn, unwashed, with all original tags and packaging intact. Discounted clearance items may have specific return limitations as described at the time of purchase.
            </p>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-1">5. Verified Customer Reviews & Community Conduct</h4>
            <p>
              Customer reviews may only be submitted by verified purchasers who have ordered the item. Reviews must remain respectful, factual, and free from abusive language, spam, or promotional material. Store administrators reserve full rights to moderate, approve, or remove inappropriate reviews.
            </p>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-1">6. Privacy & Data Protection</h4>
            <p>
              Your personal data, contact information, and purchase history are securely handled and will never be sold to third parties. We use your contact details solely for order processing, delivery updates, and customer support.
            </p>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="bg-black text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
            >
              I Accept Terms
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;
