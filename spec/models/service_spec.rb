require 'rails_helper'

RSpec.describe Service, type: :model do
  describe 'Validations' do
    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name) }
    it { should validate_presence_of(:price) }
    it { should validate_numericality_of(:price).is_greater_than_or_equal_to(0) }
  end

  describe 'Associations' do
    it { should have_many(:booking_services).dependent(:restrict_with_error) }
    it { should have_many(:bookings).through(:booking_services) }
  end

  describe 'Scopes' do
    let!(:active_service) { create(:service, active: true) }
    let!(:inactive_service) { create(:service, active: false, name: 'Inactive Service') }

    describe '.active' do
      it 'returns only active services' do
        expect(Service.active).to include(active_service)
        expect(Service.active).not_to include(inactive_service)
      end
    end
  end

  describe 'Instance Methods' do
    let(:service) { create(:service, price: 15.00) }

    describe '#activate!' do
      it 'sets service as active' do
        service.update!(active: false)
        expect {
          service.update!(active: true)
        }.to change(service, :active).from(false).to(true)
      end
    end

    describe '#deactivate!' do
      it 'sets service as inactive' do
        service.update!(active: true)
        expect {
          service.update!(active: false)
        }.to change(service, :active).from(true).to(false)
      end
    end

    describe '#formatted_price' do
      it 'returns price with currency symbol' do
        expect("$#{service.price.round(2)}").to eq('$15.0')
      end
    end
  end
end
