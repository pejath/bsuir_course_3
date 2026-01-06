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
      namespace :public do
        resources :rooms, only: [:index, :show] do
          member do
            get :availability
          end
        end
        resources :room_types, only: [:index, :show]
        resources :bookings, only: [:create, :show]
        resources :services, only: [:index]
      end

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
      resources :users do
        member do
          patch :toggle_active
          patch :reset_password
        end
      end

      get 'analytics/dashboard', to: 'analytics#dashboard'
      get 'analytics/occupancy_rate', to: 'analytics#occupancy_rate'
      get 'analytics/revenue_report', to: 'analytics#revenue_report'
      get 'analytics/room_statistics', to: 'analytics#room_statistics'
      get 'analytics/revenue_trend', to: 'analytics#revenue_trend'
      get 'analytics/bookings_trend', to: 'analytics#bookings_trend'
      get 'analytics/occupancy_trend', to: 'analytics#occupancy_trend'
      get 'analytics/lead_time_stats', to: 'analytics#lead_time_stats'
      get 'analytics/top_room_types', to: 'analytics#top_room_types'
      get 'analytics/guest_countries', to: 'analytics#guest_countries'
      get 'analytics/services_analytics', to: 'analytics#services_analytics'
      get 'analytics/export_pdf', to: 'analytics#export_pdf'
      get 'analytics/export_excel', to: 'analytics#export_excel'
    end
  end

  get '*path', to: 'application#fallback_index_html', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end
end
