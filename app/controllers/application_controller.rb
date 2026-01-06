require 'pagy'

class ApplicationController < ActionController::API
  include Pundit::Authorization
  include Pagy::Method

  before_action :authenticate_user_from_token!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def authenticate_user_from_token!
    token = request.headers['Authorization']&.split(' ')&.last
    return render json: { error: 'Unauthorized' }, status: :unauthorized unless token

    # Find auth token and ensure it's not expired
    auth_token = AuthToken.active.by_token(token).first
    return render json: { error: 'Unauthorized' }, status: :unauthorized unless auth_token

    # Update last used timestamp
    auth_token.update_column(:last_used_at, Time.current)
    
    @current_user = auth_token.user
  end

  def current_user
    @current_user
  end

  def user_not_authorized
    render json: { error: "You are not authorized to perform this action." }, status: :forbidden
  end

  def pagy_metadata(pagy)
    {
      page: pagy.page,
      limit: pagy.limit,
      pages: pagy.pages,
      count: pagy.count,
      from: pagy.from,
      to: pagy.to,
      next: pagy.next
    }
  end

  def fallback_index_html
    render file: Rails.public_path.join('index.html')
  end

  def require_manager!
    return if current_user&.manager? || current_user&.admin?
    render json: { error: 'Manager access required' }, status: :forbidden
  end

  def require_analytics!
    return if current_user&.analytics? || current_user&.admin?
    render json: { error: 'Analytics access required' }, status: :forbidden
  end
end
