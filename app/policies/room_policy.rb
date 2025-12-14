class RoomPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.manager? || user.admin?
  end

  def update?
    user.manager? || user.admin?
  end

  def destroy?
    user.admin?
  end

  def available?
    true
  end
end
