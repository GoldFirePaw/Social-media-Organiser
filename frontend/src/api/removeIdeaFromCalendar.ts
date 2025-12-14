export const RemoveIdeaFromCalendar = async (ideaId: string) => {
    const response = await fetch(`http://localhost:3001/ideas/${ideaId}/remove-from-calendar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to remove idea from calendar');
    }

    return response.json();
}