class GuestPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    true
  end

  def update?
    user.manager? || user.admin?
  end

  def destroy?
    user.admin?
  end
end
