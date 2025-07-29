import React from 'react'

const Pricing = () => {
    return (
        <section className="m-12 rounded-[40px] dark:bg-emerald-50/90  dark:text-gray-800">
            <div className="container mx-auto p-6 overflow-x-auto">
                <table className="w-full">
                    <caption className="sr-only">Pricing plan comparison</caption>
                    <thead>
                        <tr>
                            <th></th>
                            <th scope="col">
                                <h2 className="px-2 text-lg font-medium">Free</h2>
                                <p className="mb-3">
                                    <span className="text-2xl font-bold sm:text-4xl dark:text-gray-900">0$</span>
                                    <span className="font-medium dark:text-gray-600">/mo</span>
                                </p>
                            </th>
                            <th scope="col">
                                <h2 className="px-2 text-lg font-medium">Pro</h2>
                                <p className="mb-3">
                                    <span className="text-2xl font-bold sm:text-4xl dark:text-gray-900">9$</span>
                                    <span className="font-medium dark:text-gray-600">/mo</span>
                                </p>
                            </th>
                            <th scope="col">
                                <h2 className="px-2 text-lg font-medium">Premium</h2>
                                <p className="mb-3">
                                    <span className="text-2xl font-bold sm:text-4xl dark:text-gray-900">19$</span>
                                    <span className="font-medium dark:text-gray-600">/mo</span>
                                </p>
                            </th>
                            <th scope="col">
                                <h2 className="px-2 text-lg font-medium">Lifetime</h2>
                                <p className="mb-3">
                                    <span className="text-2xl font-bold sm:text-4xl dark:text-gray-900">59$(LTD)</span>

                                </p>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="space-y-6 text-center divide-y dark:divide-gray-300">
                        <tr>
                            <th scope="row" className="text-left">
                                <h3 className="py-3">Clients</h3>
                            </th>
                            <td>
                                <span className="block text-sm">1</span>
                            </td>
                            <td>
                                <span className="block text-sm">Unlimited</span>
                            </td>
                            <td>
                                <span className="block text-sm">Unlimited</span>
                            </td>
                            <td>
                                <span className='block text-sm'>Unlimited</span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-left">
                                <h3 className="py-3">Proposals</h3>
                            </th>
                            <td>
                                <span className="block text-sm">1</span>
                            </td>
                            <td>
                                <span className="block text-sm">Unlimited</span>
                            </td>
                            <td>
                                <span className="block text-sm">Unlimited</span>
                            </td>
                            <td>
                                <span className='block text-sm'>Unlimited</span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-left">
                                <h3 className="py-3">Invoices</h3>
                            </th>
                            <td>
                                <span className='block text-sm'>1</span>
                            </td>
                            <td>
                                <span className='block text-sm'>Unlimited</span>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Included in Premium plan" className="w-5 h-5 mx-auto dark:text-violet-600">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <span className='block text-sm'>Unlimited</span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-left">
                                <h3 className="py-3">Client Portal</h3>
                            </th>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Not included in Free plan" className="w-5 h-5 mx-auto dark:text-gray-400">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Not included in Free plan" className="w-5 h-5 mx-auto dark:text-gray-400">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Included in Premium plan" className="w-5 h-5 mx-auto dark:text-violet-600">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Included in Premium plan" className="w-5 h-5 mx-auto dark:text-violet-600">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-left">
                                <h3 className="py-3">E-Mails</h3>
                            </th>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Not included in Free plan" className="w-5 h-5 mx-auto dark:text-gray-400">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Included in Premium plan" className="w-5 h-5 mx-auto dark:text-violet-600">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Included in Premium plan" className="w-5 h-5 mx-auto dark:text-violet-600">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <span className='block text-sm'>Unlimited</span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-left">
                                <h3 className="py-3">Analytics</h3>
                            </th>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Not included in Free plan" className="w-5 h-5 mx-auto dark:text-gray-400">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Not included in Standard plan" className="w-5 h-5 mx-auto dark:text-gray-400">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-label="Included in Premium plan" className="w-5 h-5 mx-auto dark:text-violet-600">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </td>
                            <td>
                                <span className='block text-sm'>Unlimited</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default Pricing