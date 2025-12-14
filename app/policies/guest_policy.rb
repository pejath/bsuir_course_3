class GuestPolicy < ApplicationPolicy
  def index?
    user.staff? || user.manager? || user.admin?
  end

  def show?
    user.staff? || user.manager? || user.admin?
  end

  def create?
    true
  end

  def update?
    user.staff? || user.manager? || user.admin?
  end

  def destroy?
    user.manager? || user.admin?
  end
end
