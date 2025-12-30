require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'Associations' do
    it { should have_many(:bookings).dependent(:nullify) }
    it { should have_many(:auth_tokens).dependent(:destroy) }
  end

  describe 'Enums' do
    it { should define_enum_for(:role).with_values(guest: 0, staff: 1, manager: 2, admin: 3) }
  end

  describe 'Validations' do
    it { should validate_presence_of(:first_name) }
    it { should validate_presence_of(:last_name) }
    it { should validate_presence_of(:role) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
  end

  describe 'Callbacks' do
    it 'sets default role to guest for new records' do
      user = User.new(email: 'test@example.com', password: 'password')
      expect(user.role).to eq('guest')
    end
  end

  describe 'Methods' do
    let(:user) { create(:user) }

    describe '#create_auth_token!' do
      it 'creates a new auth token for the user' do
        expect {
          user.create_auth_token!(device_info: 'Test Device')
        }.to change(AuthToken, :count).by(1)

        token = AuthToken.last
        expect(token.user).to eq(user)
        expect(token.device_info).to eq('Test Device')
      end
    end

    describe '#find_auth_token' do
      it 'finds active token by token string' do
        auth_token = create(:auth_token, user: user)
        expect(user.find_auth_token(auth_token.token)).to eq(auth_token)
      end

      it 'returns nil for expired token' do
        auth_token = create(:auth_token, user: user, expires_at: 1.day.ago)
        expect(user.find_auth_token(auth_token.token)).to be_nil
      end
    end
  end

  describe 'Devise modules' do
    it 'includes database_authenticatable' do
      expect(User.devise_modules).to include(:database_authenticatable)
    end

    it 'includes registerable' do
      expect(User.devise_modules).to include(:registerable)
    end

    it 'includes recoverable' do
      expect(User.devise_modules).to include(:recoverable)
    end

    it 'includes rememberable' do
      expect(User.devise_modules).to include(:rememberable)
    end

    it 'includes validatable' do
      expect(User.devise_modules).to include(:validatable)
    end
  end
end
