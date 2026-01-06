require 'rails_helper'

RSpec.describe Guest, type: :model do
  describe 'Associations' do
    it { should have_many(:bookings).dependent(:destroy) }
  end

  describe 'Validations' do
    it { should validate_presence_of(:first_name) }
    it { should validate_presence_of(:last_name) }
    it { should validate_presence_of(:phone) }
    it { should allow_value('test@example.com').for(:email) }
    it { should allow_value(nil).for(:email) }
    it { should allow_value('').for(:email) }
  end

  describe 'Instance Methods' do
    let(:guest) { create(:guest) }

    describe '#full_name' do
      it 'returns the full name' do
        guest = build(:guest, first_name: 'John', last_name: 'Doe')
        expect("#{guest.first_name} #{guest.last_name}").to eq('John Doe')
      end
    end

    describe '#active_bookings' do
      it 'returns only active bookings' do
        active_booking = create(:booking, guest: guest, status: :confirmed)
        inactive_booking = create(:booking, guest: guest, status: :cancelled)

        expect(guest.bookings.active).to include(active_booking)
        expect(guest.bookings.active).not_to include(inactive_booking)
      end
    end

    describe '#total_spent' do
      it 'calculates total amount spent on completed payments' do
        booking1 = create(:booking, guest: guest)
        booking2 = create(:booking, guest: guest)

        create(:payment, booking: booking1, amount: 100, status: :completed)
        create(:payment, booking: booking2, amount: 150, status: :completed)
        create(:payment, booking: booking1, amount: 50, status: :pending)

        total_completed = guest.bookings.joins(:payments)
                              .where(payments: { status: :completed })
                              .sum('payments.amount')
        expect(total_completed).to eq(250)
      end
    end
  end

  describe 'Scopes' do
    let!(:guest1) { create(:guest, created_at: 1.month.ago) }
    let!(:guest2) { create(:guest, created_at: 1.week.ago) }
    let!(:guest3) { create(:guest, created_at: 2.days.ago) }

    describe '.recent' do
      it 'returns recent guests ordered by creation date' do
        recent_guests = Guest.order(created_at: :desc).limit(2)
        expect(recent_guests).to eq([ guest3, guest2 ])
      end
    end

    describe '.by_country' do
      it 'groups guests by country' do
        create(:guest, country: 'USA')
        create(:guest, country: 'USA')
        create(:guest, country: 'UK')

        result = Guest.group(:country).count
        expect(result['USA']).to eq(2)
        expect(result['UK']).to eq(1)
      end
    end
  end
end
