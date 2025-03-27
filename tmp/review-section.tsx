                {/* Review Sections */}
                <div className="space-y-6">
                  {/* Deal Details Summary */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Deal Details</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Name</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {(() => {
                              // Preview the auto-generated deal name
                              const dealType = getTypedValue("dealType");
                              const salesChannel = getTypedValue("salesChannel");
                              const termStartDate = getTypedValue("termStartDate");
                              const termEndDate = getTypedValue("termEndDate");
                              const dealStructure = getTypedValue("dealStructure");
                              
                              if (!dealType || !salesChannel || !termStartDate || !termEndDate || !dealStructure) {
                                return "Will be auto-generated on submission";
                              }
                              
                              // Get client name
                              let clientName = "";
                              if (salesChannel === "client_direct" && getTypedValue("advertiserName")) {
                                clientName = String(getTypedValue("advertiserName"));
                              } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") 
                                        && getTypedValue("agencyName")) {
                                clientName = String(getTypedValue("agencyName"));
                              }
                              
                              if (!clientName) return "Will be auto-generated on submission";
                              
                              // Format mapping
                              const dealTypeMap = {
                                grow: "Grow",
                                protect: "Protect",
                                custom: "Custom"
                              };
                              
                              const salesChannelMap = {
                                client_direct: "Direct",
                                holding_company: "Holding",
                                independent_agency: "Indep"
                              };
                              
                              const dealStructureMap = {
                                tiered: "Tiered",
                                flat_commit: "Flat"
                              };
                              
                              // Format dates
                              const startDateFormatted = format(termStartDate as Date, 'yyyyMMdd');
                              const endDateFormatted = format(termEndDate as Date, 'yyyyMMdd');
                              
                              return `${dealTypeMap[dealType as keyof typeof dealTypeMap]}_${salesChannelMap[salesChannel as keyof typeof salesChannelMap]}_${clientName}_${dealStructureMap[dealStructure as keyof typeof dealStructureMap]}_${startDateFormatted}-${endDateFormatted}`;
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Region</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("region") ? 
                              String(getTypedValue("region"))
                                .replace(/\b\w/g, (char) => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Sales Channel</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("salesChannel") ? 
                              String(getTypedValue("salesChannel"))
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">
                            {salesChannel === "client_direct" ? "Advertiser Name" : "Agency Name"}
                          </dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {salesChannel === "client_direct" 
                              ? (getTypedValue("advertiserName") || "Not provided") 
                              : (getTypedValue("agencyName") || "Not provided")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Type</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("dealType") ? 
                              String(getTypedValue("dealType"))
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-slate-500">Business Summary</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("businessSummary") ? String(getTypedValue("businessSummary")) : "Not provided"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {/* Deal Structure & Pricing Summary */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Deal Structure & Pricing</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Structure</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("dealStructure") ? 
                              String(getTypedValue("dealStructure"))
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Contract Term</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("contractTerm") ? 
                              `${getTypedValue("contractTerm")} months` : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Term Start Date</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("termStartDate") ? 
                              format(getTypedValue("termStartDate") as Date, 'MMMM d, yyyy') : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Term End Date</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("termEndDate") ? 
                              format(getTypedValue("termEndDate") as Date, 'MMMM d, yyyy') : 
                              "Not provided"}
                          </dd>
                        </div>
                      </dl>
                      
                      {/* Revenue Structure Summary */}
                      {dealStructureType === "tiered" && dealTiers.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Revenue Structure</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Tier</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Annual Revenue</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Gross Margin %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dealTiers.map(tier => (
                                  <tr key={tier.tierNumber}>
                                    <td className="p-2 border border-slate-200">Tier {tier.tierNumber}</td>
                                    <td className="p-2 border border-slate-200">
                                      {tier.annualRevenue ? formatCurrency(tier.annualRevenue) : "—"}
                                    </td>
                                    <td className="p-2 border border-slate-200">
                                      {tier.annualGrossMarginPercent ? `${tier.annualGrossMarginPercent}%` : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Selected Incentives Summary */}
                      {selectedIncentives.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Selected Incentives</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Incentive Name</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Applicable Tiers</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedIncentives.map(incentive => (
                                  <tr key={incentive.id}>
                                    <td className="p-2 border border-slate-200">{incentive.name}</td>
                                    <td className="p-2 border border-slate-200">
                                      {incentive.tierIds.map(tierId => `Tier ${tierId}`).join(", ")}
                                    </td>
                                    <td className="p-2 border border-slate-200">
                                      {incentive.tierValues ? 
                                        Object.entries(incentive.tierValues)
                                          .map(([tier, value]) => `Tier ${tier}: ${formatCurrency(value)}`)
                                          .join(", ") : 
                                        "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Tier-Specific Incentives Summary */}
                      {tierIncentives.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Tier-Specific Incentives</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Tier</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Type</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Percentage</th>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tierIncentives.map(incentive => (
                                  <tr key={incentive.tierId}>
                                    <td className="p-2 border border-slate-200">Tier {incentive.tierId}</td>
                                    <td className="p-2 border border-slate-200">
                                      {incentive.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                    </td>
                                    <td className="p-2 border border-slate-200">{incentive.percentage}%</td>
                                    <td className="p-2 border border-slate-200">
                                      {incentive.value ? formatCurrency(incentive.value) : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Financial Summary */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Financial Summary</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr>
                                <th className="text-left p-2 bg-slate-100 border border-slate-200">Tier</th>
                                <th className="text-left p-2 bg-slate-100 border border-slate-200">Total Incentive Cost</th>
                                <th className="text-left p-2 bg-slate-100 border border-slate-200">Gross Profit (New)</th>
                                <th className="text-left p-2 bg-slate-100 border border-slate-200">Growth Rate</th>
                                <th className="text-left p-2 bg-slate-100 border border-slate-200">Total Client Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dealTiers.filter(tier => tier.annualRevenue).map(tier => {
                                const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                                const grossProfit = calculateTierGrossProfit(tier);
                                const profitGrowthRate = calculateProfitGrowthRate(tier);
                                const clientValue = (tier.annualRevenue || 0) * 0.4; // 40% of revenue as mock value
                                
                                return (
                                  <tr key={tier.tierNumber}>
                                    <td className="p-2 border border-slate-200">Tier {tier.tierNumber}</td>
                                    <td className="p-2 border border-slate-200">{formatCurrency(incentiveCost)}</td>
                                    <td className="p-2 border border-slate-200">{formatCurrency(grossProfit)}</td>
                                    <td className="p-2 border border-slate-200">
                                      <span className={profitGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                                        {(profitGrowthRate * 100).toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="p-2 border border-slate-200">{formatCurrency(clientValue)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Approval Information */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Approval Information</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Non-Standard Terms</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {hasNonStandardTerms ? "Yes" : "No"}
                          </dd>
                        </div>
                        {hasNonStandardTerms && (
                          <div>
                            <dt className="text-sm font-medium text-slate-500">Required Approvals</dt>
                            <dd className="mt-1 text-sm text-slate-900">
                              <ul className="list-disc pl-5 text-sm">
                                <li>Finance Team</li>
                                <li>Regional Director</li>
                                <li>Legal Department</li>
                                <li>Executive Committee</li>
                              </ul>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>