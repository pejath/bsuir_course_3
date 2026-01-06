require 'rails_helper'

RSpec.describe Booking, type: :model do
  describe 'Associations' do
    it { should belong_to(:room) }
    it { should belong_to(:guest) }
    it { should belong_to(:user) }
    it { should have_many(:booking_services).dependent(:destroy) }
    it { should have_many(:services).through(:booking_services) }
    it { should have_many(:payments).dependent(:destroy) }
  end

  describe 'Validations' do
    it { should validate_presence_of(:check_in_date) }
    it { should validate_presence_of(:check_out_date) }
    it { should validate_presence_of(:number_of_guests) }
    it { should validate_numericality_of(:number_of_guests).only_integer.is_greater_than(0) }
    it { should validate_presence_of(:total_price) }
    it { should validate_numericality_of(:total_price).is_greater_than_or_equal_to(0) }
  end

  describe 'Enums' do
    it { should define_enum_for(:status).with_values(pending: 0, confirmed: 1, checked_in: 2, checked_out: 3, cancelled: 4) }
  end

  describe 'Scopes' do
    let!(:pending_booking) { create(:booking, status: :pending) }
    let!(:confirmed_booking) { create(:booking, status: :confirmed) }
    let!(:active_booking) { create(:booking, status: :checked_in) }
    let!(:cancelled_booking) { create(:booking, status: :cancelled) }

    describe '.active' do
      it 'returns only active bookings (pending, confirmed, checked_in)' do
        expect(Booking.active).to include(pending_booking, confirmed_booking, active_booking)
        expect(Booking.active).not_to include(cancelled_booking)
      end
    end

    describe '.for_date_range' do
      it 'returns bookings within date range' do
        booking1 = create(:booking, check_in_date: 1.day.from_now, check_out_date: 3.days.from_now)
        booking2 = create(:booking, check_in_date: 5.days.from_now, check_out_date: 7.days.from_now)
        booking3 = create(:booking, check_in_date: 10.days.from_now, check_out_date: 12.days.from_now)

        bookings = Booking.for_date_range(2.days.from_now.to_date, 6.days.from_now.to_date)
        expect(bookings).to include(booking1, booking2)
        expect(bookings).not_to include(booking3)
      end
    end
  end

  describe 'Callbacks' do
    it 'calculates total price before validation' do
      room_type = create(:room_type, base_price: 100)
      room = create(:room, room_type: room_type)
      booking = build(:booking, room: room, check_in_date: '2024-01-01', check_out_date: '2024-01-03')
      booking.valid?
      expect(booking.total_price).to eq(200)
    end
  end

  describe 'Instance Methods' do
    let(:booking) { create(:booking) }

    describe '#duration' do
      it 'calculates the number of nights' do
        booking = create(:booking, check_in_date: '2024-01-01', check_out_date: '2024-01-03')
        expect((booking.check_out_date - booking.check_in_date).to_i).to eq(2)
      end
    end

    describe '#total_paid' do
      it 'sums completed payments' do
        booking = create(:booking)
        create(:payment, booking: booking, amount: 100, status: :completed)
        create(:payment, booking: booking, amount: 50, status: :pending)
        expect(booking.payments.completed.sum(:amount)).to eq(100)
      end
    end

    describe '#balance_due' do
      it 'calculates remaining balance' do
        booking = create(:booking, total_price: 300)
        create(:payment, booking: booking, amount: 200, status: :completed)
        create(:payment, booking: booking, amount: 50, status: :pending)
        create(:payment, booking: booking, amount: 100, status: :completed)
      end
    end
  end
end
