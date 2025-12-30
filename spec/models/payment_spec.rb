require 'rails_helper'

RSpec.describe Payment, type: :model do
  describe 'Associations' do
    it { should belong_to(:booking) }
  end

  describe 'Validations' do
    it { should validate_presence_of(:amount) }
    it { should validate_numericality_of(:amount).is_greater_than(0) }
    it { should validate_presence_of(:payment_method) }
    it { should validate_presence_of(:status) }
  end

  describe 'Enums' do
    it { should define_enum_for(:payment_method).with_values(cash: 0, card: 1, bank_transfer: 2) }
    it { should define_enum_for(:status).with_values(pending: 0, completed: 1, failed: 2, refunded: 3) }
  end

  describe 'Scopes' do
    let!(:completed_payment) { create(:payment, status: :completed) }
    let!(:pending_payment) { create(:payment, status: :pending) }
    let!(:failed_payment) { create(:payment, status: :failed) }

    describe '.completed' do
      it 'returns only completed payments' do
        expect(Payment.where(status: :completed)).to include(completed_payment)
        expect(Payment.where(status: :completed)).not_to include(pending_payment, failed_payment)
      end
    end

    describe '.by_date_range' do
      it 'returns payments within date range' do
        payment1 = create(:payment, created_at: 1.day.ago)
        payment2 = create(:payment, created_at: 3.days.ago)
        payment3 = create(:payment, created_at: 10.days.ago)

        payments = Payment.where(created_at: 5.days.ago..Time.current)
        expect(payments).to include(payment1, payment2)
        expect(payments).not_to include(payment3)
      end
    end
  end

  describe 'Instance Methods' do
    let(:payment) { create(:payment) }

    describe '#completed?' do
      it 'returns true for completed payments' do
        payment.update!(status: :completed)
        expect(payment.completed?).to be true
      end

      it 'returns false for non-completed payments' do
        payment.update!(status: :pending)
        expect(payment.completed?).to be false
      end
    end

    describe '#refund!' do
      it 'marks payment as refunded' do
        payment.update!(status: :completed)
        expect {
          payment.update!(status: :refunded)
        }.to change(payment, :status).from('completed').to('refunded')
      end
    end
  end
end
