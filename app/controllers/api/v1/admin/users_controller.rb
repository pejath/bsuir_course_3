class Api::V1::Admin::UsersController < Api::V1::BaseController
  before_action :authenticate_user_from_token!
  before_action :require_admin!
  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    authorize User
    users = policy_scope(User)
    render json: users, status: :ok
  end

  def create
    authorize User
    user = User.new(user_params)
    if user.save
      render json: user, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @user = User.find(params[:id])
    authorize @user
    
    if @user.update(user_params)
      render json: @user, status: :ok
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @user = User.find(params[:id])
    authorize @user
    
    if @user.destroy
      head :no_content
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def toggle_active
    @user = User.find(params[:id])
    authorize @user
    
    # Toggle between staff (active) and guest (inactive) roles
    if @user.staff?
      @user.update!(role: :guest)
      # Revoke all tokens when deactivating
      @user.auth_tokens.update_all(expires_at: Time.current)
    else
      @user.update!(role: :staff)
    end
    
    render json: @user, status: :ok
  end

  def reset_password
    @user = User.find(params[:id])
    authorize @user
    
    if @user.update(password_params)
      # Revoke all existing tokens to force re-login
      @user.auth_tokens.update_all(expires_at: Time.current)
      render json: { message: 'Password reset successfully' }, status: :ok
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :password, :role)
  end

  def password_params
    params.require(:user).permit(:password)
  end

  def require_admin!
    return if current_user&.admin?
    render json: { error: 'Admin access required' }, status: :forbidden
  end
end
