Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      devise_for :users, controllers: {
        sessions: 'api/v1/sessions',
        registrations: 'api/v1/registrations'
      }

      resources :rooms do
        collection do
          get :available
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
    end
  end
end
