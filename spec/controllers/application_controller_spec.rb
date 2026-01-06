require 'rails_helper'

RSpec.describe ApplicationController, type: :controller do
  let(:user) { create(:user) }
  let(:auth_token) { create(:auth_token, user: user) }

  controller do
    def index
      render json: { user_id: current_user&.id }
    end
  end

  describe 'authentication' do
    context 'with valid token' do
      before do
        request.headers['Authorization'] = "Bearer #{auth_token.token}"
      end

      it 'authenticates the user' do
        get :index
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['user_id']).to eq(user.id)
      end

      it 'updates last_used_at timestamp' do
        expect {
          get :index
        }.to change { auth_token.reload.last_used_at }
      end
    end

    context 'with expired token' do
      let(:expired_token) { create(:auth_token, user: user, expires_at: 1.day.ago) }

      before do
        request.headers['Authorization'] = "Bearer #{expired_token.token}"
      end

      it 'returns unauthorized error' do
        get :index
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    context 'with invalid token' do
      before do
        request.headers['Authorization'] = 'Bearer invalid_token'
      end

      it 'returns unauthorized error' do
        get :index
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    context 'without token' do
      it 'returns unauthorized error' do
        get :index
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
  end

  describe 'private methods' do
    describe '#pagy_metadata' do
      it 'returns pagy metadata' do
        pagy = double(:pagy, page: 2, limit: 10, pages: 10, count: 100, from: 11, to: 20, prev: 1, next: 3)
        metadata = controller.send(:pagy_metadata, pagy)

        expect(metadata[:page]).to eq(2)
        expect(metadata[:limit]).to eq(pagy.limit)
        expect(metadata[:pages]).to eq(pagy.pages)
        expect(metadata[:count]).to eq(100)
        expect(metadata[:from]).to eq(pagy.from)
        expect(metadata[:to]).to eq(pagy.to)
        expect(metadata[:next]).to eq(pagy.next)
      end
    end
  end
end
