export const AddIdeaToCalendar = async (ideaId: string, date: string) => {
    const response = await fetch(`http://localhost:3001/ideas/${ideaId}/add-to-calendar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
    });

    if (!response.ok) {
        throw new Error('Failed to add idea to calendar');
    }

    return response.json();
}