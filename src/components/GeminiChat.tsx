import React, { useState, useCallback } from 'react';
import { GeminiService } from '../config/api/geminiService';

export const GeminiChat: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setLoading(true);
        setError(null);
        setResponse('');

        try {
            const geminiService = GeminiService.getInstance();
            const result = await geminiService.generateContent(prompt);
            setResponse(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    }, [prompt, isSubmitting]);

    const handleClear = useCallback(() => {
        setPrompt('');
        setResponse('');
        setError(null);
        const geminiService = GeminiService.getInstance();
        geminiService.clearCache();
    }, []);

    return (
        <div className="max-w-2xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                        Enter your prompt:
                    </label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={4}
                        placeholder="Type your message here..."
                        disabled={loading}
                    />
                </div>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={loading || !prompt.trim() || isSubmitting}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Response'}
                    </button>

                    <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Clear
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {response && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Response:</h3>
                    <div className="whitespace-pre-wrap">{response}</div>
                </div>
            )}
        </div>
    );
}; 