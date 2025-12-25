class RoomPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.staff? || user.manager? || user.admin?
  end

  def update?
    user.staff? || user.manager? || user.admin?
  end

  def activity?
    user.staff? || user.manager? || user.admin?
  end

  def destroy?
    user.manager? || user.admin?
  end

  def available?
    true
  end
end
