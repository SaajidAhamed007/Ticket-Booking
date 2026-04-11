import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useConcertStore } from '../stores/useConcertStore';

interface LocationState {
  selectedSeats: string[];
  totalPrice: number;
  userName: string;
  userEmail: string;
}

const PaymentPage: React.FC = () => {
  const { concertId } = useParams<{ concertId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const { selectedConcert } = useConcertStore();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate navigation
  if (!state || !selectedConcert) {
    return (
      <main className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Invalid Session</h1>
          <p className="text-slate-300 mb-6">Please start a new booking</p>
          <Link to="/concerts" className="text-purple-400 hover:text-purple-300">
            ← Back to Concerts
          </Link>
        </div>
      </main>
    );
  }

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted.slice(0, 19)); // 16 digits + 3 spaces
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }

    if (!cvc.match(/^\d{3,4}$/)) {
      setError('Please enter a valid CVC (3-4 digits)');
      return;
    }

    setProcessing(true);

    try {
      // Call payment API
      const response = await fetch('http://localhost:3000/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concert_id: concertId,
          seat_ids: state.selectedSeats.map((id) => parseInt(id)),
          user_id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          total_amount: state.totalPrice,
          card_last_four: cardNumber.slice(-4)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Payment failed');
      }

      const booking = await response.json();

      // Navigate to status page with booking confirmation
      navigate('status', {
        state: {
          bookingId: booking.booking_id,
          status: 'success',
          selectedSeats: state.selectedSeats,
          totalPrice: state.totalPrice,
          userName: state.userName,
          userEmail: state.userEmail,
          concert: selectedConcert
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link to={`/book/${concertId}`} className="text-purple-400 hover:text-purple-300 mb-8 inline-flex items-center gap-2">
          ← Back to Booking
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-2xl p-8">
              <h1 className="text-4xl font-black text-white mb-8">Payment Details</h1>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono"
                    disabled={processing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono"
                      disabled={processing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">CVC</label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono"
                      disabled={processing}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
                    processing
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-linear-to-r from-red-500 to-pink-500 text-white hover:shadow-lg hover:shadow-red-500/50 transform hover:scale-105'
                  }`}
                >
                  {processing ? 'Processing Payment...' : `Pay $${state.totalPrice.toFixed(2)} →`}
                </button>
              </form>

              <p className="text-xs text-slate-400 text-center mt-6">
                This is a demo payment. Use any test card details. Your seats will be confirmed after payment.
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-linear-to-b from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>

                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-slate-300 mb-2">Concert</p>
                    <p className="text-lg font-bold text-white">{selectedConcert.artist_name}</p>
                  </div>
                  <div className="border-t border-purple-500/20 pt-3">
                    <p className="text-sm text-slate-300 mb-2">Date & Time</p>
                    <p className="text-white">{new Date(selectedConcert.concert_date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-400">{new Date(selectedConcert.concert_date).toLocaleTimeString()}</p>
                  </div>
                  <div className="border-t border-purple-500/20 pt-3">
                    <p className="text-sm text-slate-300 mb-2">Venue</p>
                    <p className="text-white">{selectedConcert.venue_name}</p>
                    <p className="text-sm text-slate-400">{selectedConcert.venue_city}</p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg space-y-3 border border-purple-500/20">
                  <div>
                    <p className="text-sm text-slate-300 mb-2">Seats ({state.selectedSeats.length})</p>
                    <div className="space-y-1">
                      {state.selectedSeats.map((seatId) => (
                        <p key={seatId} className="text-sm text-slate-300">
                          Seat #{seatId}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg space-y-3 border border-purple-500/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Subtotal:</span>
                    <span className="text-white">${state.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Fees:</span>
                    <span className="text-white">$0.00</span>
                  </div>
                  <div className="border-t border-purple-500/20 pt-3 flex justify-between">
                    <span className="font-bold text-white">Total:</span>
                    <span className="font-bold text-transparent bg-linear-to-r from-red-400 to-pink-400 bg-clip-text text-xl">
                      ${state.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                  <p className="text-xs text-blue-200">
                    <span className="font-bold">Customer Info:</span><br />
                    {state.userName}<br />
                    {state.userEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PaymentPage;
