Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users,
             path: 'api/v1/users',
             controllers: { sessions: 'api/v1/sessions', registrations: 'api/v1/registrations' },
             defaults: { format: :json },
             skip: [:sessions, :registrations]
  
  devise_scope :user do
    post 'api/v1/users/sign_in', to: 'api/v1/sessions#create'
    delete 'api/v1/users/sign_out', to: 'api/v1/sessions#destroy'
    post 'api/v1/users/sign_up', to: 'api/v1/registrations#create'
  end

  namespace :api do
    namespace :v1 do
      resources :rooms do
        collection do
          get :available
        end
        member do
          get :activity
        end
      end
      
      resources :room_types
      resources :guests
      
      resources :bookings do
        member do
          patch :cancel
        end
      end
      
      resources :services
      resources :payments

      get 'analytics/dashboard', to: 'analytics#dashboard'
      get 'analytics/occupancy_rate', to: 'analytics#occupancy_rate'
      get 'analytics/revenue_report', to: 'analytics#revenue_report'
      get 'analytics/room_statistics', to: 'analytics#room_statistics'
      get 'analytics/revenue_trend', to: 'analytics#revenue_trend'
      get 'analytics/bookings_trend', to: 'analytics#bookings_trend'
    end
  end
end
