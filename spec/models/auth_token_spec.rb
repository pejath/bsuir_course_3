require 'rails_helper'

RSpec.describe AuthToken, type: :model do
  describe 'Associations' do
    it { should belong_to(:user) }
  end

  describe 'Validations' do
    # Note: Token and expires_at presence is ensured by callbacks
    # Uniqueness of token is handled by SecureRandom
  end

  describe 'Callbacks' do
    it 'generates token before validation on create' do
      auth_token = AuthToken.new(user: build(:user))
      auth_token.valid?
      expect(auth_token.token).to be_present
      expect(auth_token.token.length).to eq(64)
    end

    it 'sets expires_at before validation on create' do
      auth_token = AuthToken.new(user: build(:user))
      auth_token.valid?
      expect(auth_token.expires_at).to be_present
      expect(auth_token.expires_at).to be_within(1.minute).of(30.days.from_now)
    end
  end

  describe 'Scopes' do
    let!(:active_token) { create(:auth_token, expires_at: 30.days.from_now) }
    let!(:expired_token) { create(:auth_token, expires_at: 1.day.ago) }

    describe '.active' do
      it 'returns only non-expired tokens' do
        expect(AuthToken.active).to include(active_token)
        expect(AuthToken.active).not_to include(expired_token)
      end
    end

    describe '.by_token' do
      it 'finds token by token string' do
        expect(AuthToken.by_token(active_token.token)).to eq([active_token])
      end
    end
  end

  describe 'Class Methods' do
    describe '.generate_token' do
      it 'generates a unique token' do
        token1 = AuthToken.generate_token
        token2 = AuthToken.generate_token
        expect(token1).not_to eq(token2)
        expect(token1.length).to eq(64)
      end
    end

    describe '.cleanup_expired' do
      it 'deletes all expired tokens' do
        create(:auth_token, expires_at: 1.day.ago)
        create(:auth_token, expires_at: 2.days.ago)
        active_token = create(:auth_token, expires_at: 30.days.from_now)

        expect {
          AuthToken.cleanup_expired
        }.to change(AuthToken, :count).by(-2)

        expect(AuthToken.find_by(id: active_token.id)).to be_present
      end
    end
  end

  describe 'Instance Methods' do
    describe '#expired?' do
      it 'returns true for expired tokens' do
        token = build(:auth_token, expires_at: 1.day.ago)
        expect(token.expired?).to be true
      end

      it 'returns false for active tokens' do
        token = build(:auth_token, expires_at: 30.days.from_now)
        expect(token.expired?).to be false
      end
    end
  end
end
