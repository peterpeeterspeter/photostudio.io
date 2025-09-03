"use client";

import { useState } from "react";
import Link from "next/link";

export default function AccountClient() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription, usage, and account settings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "billing", label: "Billing" },
              { id: "usage", label: "Usage" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "usage" && <UsageTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
        <p className="mt-1 text-gray-600">Free Plan</p>
        <p className="mt-2 text-sm text-gray-500">
          25 edits per month included
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Upgrade Plan
        </Link>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
        <p className="mt-1 text-3xl font-bold text-gray-900">12</p>
        <p className="mt-1 text-sm text-gray-500">edits used out of 25</p>
        <div className="mt-3 bg-gray-200 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full w-12/25"></div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="mt-4 space-y-2">
          <Link
            href="/editor"
            className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Start New Edit
          </Link>
          <Link
            href="/editor/batch"
            className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Batch Processing
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          <div className="text-sm">
            <p className="font-medium text-gray-900">Ghost mannequin edit</p>
            <p className="text-gray-500">2 hours ago</p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Background swap</p>
            <p className="text-gray-500">1 day ago</p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Batch processing (5 images)</p>
            <p className="text-gray-500">3 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
        <p className="mt-1 text-gray-600">You're currently on the Free plan</p>
        <div className="mt-4 flex gap-4">
          <Link
            href="/pricing"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upgrade to Pro
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            View All Plans
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
        <p className="mt-1 text-gray-600">No billing history yet</p>
        <p className="mt-2 text-sm text-gray-500">
          Upgrade to a paid plan to see your billing history here
        </p>
      </div>
    </div>
  );
}

function UsageTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Current Usage</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Images Edited</p>
            <p className="text-2xl font-bold text-gray-900">12 / 25</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "48%" }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Days Remaining</p>
            <p className="text-2xl font-bold text-gray-900">18</p>
            <p className="text-sm text-gray-500">Until next reset</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Usage History</h3>
        <div className="mt-4 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">Today</td>
                <td className="px-4 py-3 text-sm text-gray-600">Single edits</td>
                <td className="px-4 py-3 text-sm text-gray-900">3</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">Yesterday</td>
                <td className="px-4 py-3 text-sm text-gray-600">Batch processing</td>
                <td className="px-4 py-3 text-sm text-gray-900">5</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">2 days ago</td>
                <td className="px-4 py-3 text-sm text-gray-600">Single edits</td>
                <td className="px-4 py-3 text-sm text-gray-900">4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value="user@example.com"
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Name</label>
            <input
              type="text"
              placeholder="Your boutique name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Shopify</p>
              <p className="text-sm text-gray-500">Connect your store for direct uploads</p>
            </div>
            <Link
              href="/integrations/shopify"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
            >
              Connect
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-red-50 p-6 shadow">
        <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-600">
          These actions cannot be undone
        </p>
        <button className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          Delete Account
        </button>
      </div>
    </div>
  );
}