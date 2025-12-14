class BookingPolicy < ApplicationPolicy
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
    user.manager? || user.admin? || record.user_id == user.id
  end

  def destroy?
    user.admin?
  end

  def cancel?
    user.manager? || user.admin? || record.user_id == user.id
  end
end
