class PaymentPolicy < ApplicationPolicy
  def index?
    user.manager? || user.admin?
  end

  def show?
    user.manager? || user.admin?
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
