class ApplicationController < ActionController::API
  include Pundit::Authorization

  before_action :authenticate_user_from_token!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def authenticate_user_from_token!
    token = request.headers['Authorization']&.split(' ')&.last
    return render json: { error: 'Unauthorized' }, status: :unauthorized unless token

    @current_user = User.find_by(auth_token: token)
    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def user_not_authorized
    render json: { error: "You are not authorized to perform this action." }, status: :forbidden
  end
end
