class UserPolicy < ApplicationPolicy
  def index?
    user.admin?
  end

  def show?
    user.admin? || record == user
  end

  def create?
    user.admin?
  end

  def update?
    user.admin? || (record == user && !user.admin?)
  end

  def destroy?
    user.admin? && record != user && !record.admin?
  end

  def toggle_active?
    user.admin? && record != user && !record.admin?
  end

  def reset_password?
    user.admin? || record == user
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      if user.admin?
        scope.all
      else
        scope.where(id: user.id)
      end
    end

    private

    attr_reader :user, :scope
  end
end
